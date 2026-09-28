## Context

This change turns the reviewed IR for `capability_key: localization` into requirements: 25 server-ingested records, from 56 pass-level records across 23 pass files. The records come from these legacy modules: `apps/petstore` (web.xml, banner and per-locale pages, sign-on/customer/change-locale actions), `waf` (front controller, template servlet, locale parser, client-state flow handler, demo change-locale pages), `components/catalog`, `components/cart`, `components/customer`, `components/purchaseorder`, `components/xmldocuments`, `components/encodingfilter`, `apps/opc` (customer-relations email templates), `apps/admin` (Swing client resource bundles) and `docs/configuring.html`.

Every requirement in `specs/localization/spec.md` traces to one or more of those records. The legacy implementation behind each requirement is noted below so the implementing agent can check behaviour against the source.

## Goals / Non-Goals

**Goals**

- Reproduce the locale behaviour customers observe: supported locales, session default, switching, preferred-language application, per-locale pages, catalog data, prices, emails and form options.
- Carry the legacy defects and disputes forward as explicit open questions, not silent choices.

**Non-Goals**

- The core rules of catalog, cart, customer, sign-on, order processing and notification. Those capabilities own them. This change owns only their locale dimension.
- Currency conversion. The legacy system never converts. Each locale carries its own price row.
- Replicating the legacy table-per-locale naming helper, the unused currency formatter and the JIS auto-detection helper (see D7).

## Decisions

### D1. Locale model and identifier format

Locales are identified by `language_COUNTRY` strings everywhere: session, customer profile, purchase order, catalog rows and cart. The rebuild should keep one parser. The legacy tree has four copies of the same parser: WAF `I18nUtil.getLocaleFromString` (I18nUtil.java:168-196), `CatalogHelper.getLocaleFromString` (CatalogHelper.java:359-386), `XMLDocumentUtils.getLocaleFromString` (XMLDocumentUtils.java:644-678) and OPC `LocaleUtil.getLocaleFromString` (LocaleUtil.java:48-75). All four behave the same: `null` becomes no locale, `default` (case-insensitive) becomes the JVM default, a string with no `_` becomes no locale, and otherwise the result is `new Locale(language, country)`. In all four the variant branch is dead (`variantIndex` is never assigned) and a three-part string yields a malformed country. The spec therefore says the rebuild MUST NOT rely on three-part identifiers.

### D2. Session locale lifecycle

- The default is assigned in `MainServlet.doProcess` (MainServlet.java:79-81, 108-113) from the `default_locale` init-param. Petstore web.xml:96-99 sets it to `en_US`, and the WAF sample descriptor does the same. The template servlet also applies its own default without writing it to the session. The rebuild should use a single default path.
- Supported locales come from the TemplateServlet `locales` init-param `en_US,ja_JP,zh_CN` (web.xml:108-115), with one `screendefinitions_<locale>.xml` per locale.
- For the language switch, `banner.jsp:75-105` renders three flag links (`us_flag.gif`, `ja_flag.gif`, `zh_flag.gif`) to `changelocale.do?locale=…`, with request parameters and attributes encoded. `mappings.xml:101-104` binds `changelocale.do` to `ChangeLocaleHTMLAction` and `ClientStateFlowHandler`. The flow handler forwards to the `referring_screen` parameter and rehydrates `<cacheId>_attribute_*` fields (ClientStateFlowHandler.java:66-101, ClientStateTag.java:149-155). The petstore `ChangeLocaleEJBAction` (petstore actions, :59-68) sets the state-machine locale and calls `cart.setLocale`.
- On rejection, `ChangeLocaleHTMLAction` (:70-84) throws `HTMLActionException("Unable to change language to …")` before writing to the session. Which page the user then sees depends on the host application's exception mapping, which was not extracted.
- Sign-on and profile save: `SignOnNotifier` (:113-142) sets the session locale from `profile.getPreferredLanguage()`. `SignOnEJBAction` (:84-95) sets the machine and cart locale and swallows `FinderException` for first-time users. `CustomerEJBAction` (:142-144) does the same after a profile update. `ProfileLocalHome:44` defaults `preferredLanguage` to `"en_US"`.
- In the rebuild, the session locale lives server-side, in the Nitro session or a cookie read by middleware. The SPA reads it from the server so that the page, the cart and the server-side operations agree. The referring-page return maps naturally to "stay on the current route and re-fetch in the new locale". The SPA does not need to replicate the hidden-field serialization.

### D3. Page resolution

`TemplateServlet` (:102-112, 157-166, 231-253) applies this precedence: request `locale` param, then session locale, then `default_locale` when no screen set is loaded. Per screen, it falls back to the default-locale set. When a screen is still missing it prints `Definition for screen X not found`. The request override is not persisted to the session. The spec keeps that behaviour ("for that request only"). In the SPA this becomes a per-locale message/content bundle with default-locale fallback per page.

### D4. Catalog and prices

Every catalog DAO statement binds `locale.toString()` as parameter 1 (CloudscapeCatalogDAO.java:85-88, 138-148; GenericCatalogDAO.java:272-294), and item queries join `b.locale = c.locale`. Single-row lookups return `null` when no row exists, so there is no fallback. `item_details` has primary key `(itemid, locale)` and carries `listprice` and `unitcost` (PopulateSQL.xml:146-158). Each language's pages hard-set the formatter locale (`cart.jsp:47` en_US, `ja/cart.jsp:49` ja_JP, `zh/cart.jsp:49` zh_CN, `ja/item.jsp:55`). In the Drizzle schema, the `*_details` tables should carry a `locale` text column in a composite primary key with the entity id. The exact table files belong to the catalog capability's change.

The cart defaults to `Locale.US` (ShoppingCartLocalEJB.java:65-78, commented "default to the US English") and passes its locale to `catalog.getItem(key, locale)` (:94).

### D5. Orders and emails

The order locale defaults to `en_US` in two places: DTD `ATTLIST PurchaseOrder locale CDATA "en_US"` (PurchaseOrder.dtd:40-42) and `private Locale locale = Locale.US` (PurchaseOrder.java:74). It is persisted as `poLocale` (PurchaseOrderEJB.java:202). `MailContentXDE.getStyleSheetPath` (:136-165) inserts `_<locale>` before `.xsl` and throws `FormatterException("No style sheet found for locale")` when the template is missing. The MDBs wrap that in `EJBException`, which rolls the message back (MailInvoiceMDB.java:164-166). The templates are `CompletedOrder_*`, `PartialInvoice_*` and the approval templates for `en_US`, `ja_JP` and `zh_CN`, plus a locale-neutral base. The price formats come from `format-number` patterns (CompletedOrder_en_US.xsl:39, \_ja_JP.xsl:37, \_zh_CN.xsl:39; PartialInvoice.xsl:40, \_ja_JP.xsl:39, \_zh_CN.xsl:40).

### D6. Encoding, form options, admin client and the locale selection screen

- `EncodingFilter` (EncodingFilter.java:61-78) calls `setCharacterEncoding` from the `encoding=UTF-8` init-param on `/*` (web.xml:48-57, 69-72). It is mapped before `SignOnFilter` (web.xml:68-79). Pages declare `charset=UTF-8` (template.jsp:39). Nitro/H3 decode UTF-8 by default, so the rebuild needs a test, not a filter.
- The state/province literals are in `enter_order_information.jsp:130-132`, `ja/…:102-104` and `zh/…:92-94`. No reference data backs them.
- The admin client reads `PetStoreAdminClient.getString/getMnemonic` (:254-287) from `resources.petstore`, which has `petstore.properties` and `petstore_de.properties`. The locale is the JVM default, and no explicit selector exists.
- The locale selection screen is `waf/src/docroot/changelocale.jsp:48-57`. It is a `<select name="locale">` with four options and a "Change Locale" submit posting to `changelocale.do`. The confirmation is `changelocalesuccess.jsp:46-47`, reached via `locale_change_success.screen` in the WAF sample `mappings.xml:48-50`. This is the WAF framework's demo page. The storefront itself switches language through the banner links (D2). See Q4.

### D7. Records not carried into the spec

These records mark themselves `disputed` with reachability unresolved and no caller in the tree. They are recorded here, not written as requirements, pending human confirmation that they are dead:

- `DatabaseNames.getTableName` (DatabaseNames.java:55-65) suffixes table names with `_ja` or `_zh`. It has no caller, and the live queries use locale columns instead.
- `I18nUtil.formatCurrency` (I18nUtil.java:100-105) formats locale currency with a fixed precision. It has no caller outside WAF.
- `I18nUtil.convertJISEncoding` (I18nUtil.java:63-77) decodes Shift-JIS/JIS by auto-detection. It has no caller, and it swallows errors and returns null.

## Risks / Trade-offs / Open Questions

- **Q1. Supported locale list.** `docs/configuring.html:205-240` lists only English and Japanese. The code and configuration ship `zh_CN` as well. The spec follows the deployed configuration (three locales).
- **Q2. zh_CN email price format.** The `zh_CN` templates use `$#,##0.00`, which looks copied from `en_US`. The storefront pages format zh prices in the Chinese convention. The spec records the legacy email behaviour. A human should decide whether Chinese emails should show yuan.
- **Q3. Emails fail instead of falling back.** An order locale with no template makes email generation fail, with a transaction rollback. The spec records this. It may be unintended.
- **Q4. German in the locale selection screen.** The demo selector offers `de_DE`, which the storefront does not configure. Submitting it succeeds, and pages then fall back to `en_US` definitions (D3). The admin client does ship German strings. The screen requirement records the four options as extracted. Whether the rebuild's selector should list only the three storefront locales, and whether this demo screen is needed at all alongside the header switch, is a product decision.
- **Q5. Per-locale prices.** It is not stated whether the per-locale price rows are different currencies or translations of one price. The spec requires display without conversion.
- **Q6. Server-side locale propagation in WAF.** The WAF sample's event mapping names a non-existent event class, and the component manager creates a fresh stateful controller per event. The petstore app maps the event to its own action, which is reachable. The spec requires propagation, following the petstore behaviour.
- **Q7. Null locale downstream.** A catalog request whose locale fails to parse would produce an NPE in the legacy DAO. The rebuild should validate the locale at the boundary. The locale-change path already rejects it.

## Migration Plan

This is a greenfield rebuild with no data migration from the legacy datastore. The catalog seed data must be loaded per locale for all three locales.

## Sprint plan (SWHR-S-0002)

_Added by planning ticket SWHR-T-0010. Everything above this heading is the adopted specification and is unchanged._

### Codebase findings

- The repository is the bootstrap shell from change `swhr-i-0002-bootstrap-landing-page-and-s`: a routed SPA (`src/pages/`) with placeholder pages for cart, checkout, account, sign-in, admin and supplier, a shared layout (`src/components/layout/`), and a Nitro server with one demo middleware (`middleware/auth.ts`) and a demo `users` resource (`routes/api/users/`, `db/schema.ts`).
- Nothing handles locale. `SiteHeader.tsx` already renders three language buttons (codes `en`/`ja`/`zh`, labels English/日本語/中文) with `aria-pressed` hard-wired to English and no handler. The strip is `hidden sm:flex`, and the mobile drawer in `GlobalNav.tsx` has no language control. `index.html` hard-codes `<html lang="en">`.
- No catalog, cart, customer profile, purchase order, e-mail or admin client exists yet. Those capabilities are separate changes (`swhr-i-0005` … `swhr-i-0013`) not in this sprint. `architecture/rebuild-guidance.md` §3.7 makes localization "order 1": it owns the locale model that the others build on.
- `architecture/schema.sql` gives the target catalog tables (`category`, `category_details`, `product`, `product_details`, `item`, `item_details`), each `*_details` keyed `(id, locale)`. `rebuild-guidance.md` requires prices as integer minor units.
- There is no session mechanism. H3 2 ships `useSession` (sealed cookie).
- Test placement is path-decided: `routes/**/*.test.ts` runs in the Vitest `server` project (node, `bun:sqlite` resolvable); everything else runs in jsdom. `tsconfig.node.json` covers `routes`, `middleware`, `db`, `configs`, `e2e`; `tsconfig.json` covers `src`.
- CI (`.github/workflows/ci.yml`) already runs on `vortex/**` pushes and PRs: doc-links, typecheck, lint, unit tests with JUnit upload.

### Implementation decisions

- **P1. One locale module, in a new `lib/` tree.** Server-side and shared code lives under `lib/` (added to `tsconfig.node.json` and to the Vitest `server` project, so `lib/**/*.test.ts` can reach the database). `lib/locale/model.ts` is the only parser and the only list of supported locales; the SPA imports it too. Nitro scans `routes/`, `middleware/`, `plugins/`, `utils/` under `serverDir: "./"`, so `lib/` is not auto-registered.
- **P2. Session locale is server-authoritative.** `middleware/locale.ts` loads an H3 sealed-cookie session, assigns the default locale when absent, and sets `event.context.locale` for every handler (this is how business operations "read" it, D2). The session holds `locale` and `cartLocale`. The SPA learns the locale from `GET /api/locale` and changes it with `POST /api/locale`; it never decides the locale itself.
- **P3. Screen content is a per-screen, per-locale definition file.** `src/i18n/screens/<screen>.ts` each export `{ en_US, ja_JP?, zh_CN? }` string maps; a registry built with `import.meta.glob` finds them, so later tasks add screens without editing a shared file. `resolveScreen(screen, locale)` implements D3: requested locale → en_US definition → error `Definition for screen <name> not found`. A `?locale=` query parameter overrides the session locale for that render only.
- **P4. Catalog tables are created here, locale-first.** The catalog capability has not been sprinted; its tables are created now exactly as `architecture/schema.sql` shapes them, with prices as integer minor units, so catalog-browsing extends them rather than re-keying them.
- **P5. Cart locale lives in the session until a cart exists.** Shopping-cart will persist cart contents; the locale it prices by is `cartLocale` from the session, read through `lib/locale/session.ts`.
- **P6. No purchase-order table in this sprint.** The order locale is delivered as `normaliseOrderLocale()` plus the locale column contract; checkout (swhr-i-0009) persists it.
- **P7. E-mail templates are TypeScript render functions keyed `<kind>_<locale>`,** with a locale-neutral base per kind (D5), selected by `renderCustomerEmail()`; storefront and e-mail price formatting are separate functions because the spec gives them different rules (Q2).

### Phases

| Phase | Task        | Tasks.md group                                            | Depends on     |
| ----- | ----------- | --------------------------------------------------------- | -------------- |
| 1     | SWHR-T-0013 | 1. Locale model (also the test-harness wiring for `lib/`) | —              |
| 2     | SWHR-T-0014 | 2. Session locale                                         | T-0013         |
| 2     | SWHR-T-0015 | 6. Orders and emails                                      | T-0013         |
| 2     | SWHR-T-0016 | 7. Forms, encoding and admin strings                      | T-0013         |
| 3     | SWHR-T-0017 | 3. Preferred language                                     | T-0014         |
| 3     | SWHR-T-0018 | 4. Page localization                                      | T-0014         |
| 4     | SWHR-T-0019 | 5. Catalog and prices                                     | T-0017, T-0018 |
| 4     | SWHR-T-0020 | 8. Locale selection screen                                | T-0018         |

Dependencies exist wherever two tasks would touch the same file: `db/schema.ts` and `drizzle/` (T-0017 then T-0019), the screen registry and layout (T-0018 before T-0019/T-0020), `lib/locale/session.ts` (T-0014 before its consumers).

**Test-harness phase (folded into SWHR-T-0013).** Add `lib` to `tsconfig.node.json` and route `lib/**/*.test.ts` to the Vitest `server` project; every later task's server tests sit beside their module under `lib/` or `routes/`. UI tests stay `*.test.tsx` in jsdom. Each UI-bearing task (T-0018, T-0019, T-0020) adds its own Playwright spec in `e2e/` and runs it.

**CI phase.** The existing workflow already triggers on `vortex/**` pushes and pull requests and runs doc-links, typecheck, lint and the unit suite. No workflow change is needed; the Playwright tier runs at SPRINT_INTEGRATION_QA. A task that needs a new CI step (none planned) owns that change.

## Spec discrepancies

Each item is also posted as a comment on SWHR-T-0010. The delta spec is not edited.

- **SD-1. The capabilities the spec localizes do not exist yet.** Catalog, cart, customer profile, sign-on, purchase order, notifications and the admin client are absent in this repository. The spec reads as if it modifies them. Resolution for this sprint: build the locale seams (P4–P7) and test each scenario at the seam; the owning changes wire them in.
- **SD-2. D4 assigns catalog table files to the catalog change.** Localization is sprinted first (rebuild-guidance §3.7), so SWHR-T-0019 creates the catalog tables. The catalog-browsing change must extend, not recreate, them.
- **SD-3. Locale selection screen vs. PRD.** PRODUCT.md Open question 4 and rebuild-guidance §3.8 treat the WAF demo screen (with German) as evidence of a switcher, "not a page to copy". The adopted spec requires the screen with four options including German. This sprint builds it as specified (SWHR-T-0020); a product decision may later drop it or the German option.
- **SD-4. "Switch available on every page" is not true on small screens today.** The header language strip is hidden below the `sm` breakpoint and the mobile drawer has none. SWHR-T-0018 adds the switch to the drawer.
- **SD-5. Admin "mnemonics".** The legacy admin is a Swing client with keyboard mnemonics and a JVM-default locale. The rebuild admin is an SPA page; mnemonics map to `accessKey`, and the catalogue is chosen from the browser language (the JVM-default analogue), falling back to English.
- **SD-6. No purchase order to record a locale on.** Checkout (swhr-i-0009) owns the order table; this sprint verifies the order-locale scenario through `normaliseOrderLocale()`.
- **SD-7. No account-creation endpoint.** The UTF-8 scenario is verified through the demo `users` resource, the only account-shaped write path in the repository.
- **SD-8. Price storage.** `architecture/schema.sql` uses `decimal(10,2)`; rebuild-guidance requires integer minor units. Integer minor units are used; display is unaffected.
- **SD-9. zh_CN e-mail currency (Q2).** The storefront mockup shows zh_CN prices as `¥120.00` while the spec keeps the legacy `$#,##0.00` e-mail pattern for zh_CN. Both are built as specified; the e-mail pattern awaits the Q2 decision.
- **SD-10. Page-level "request locale" in an SPA.** Legacy screens took `?locale=` per request. The SPA honours `?locale=` on the URL for that render and never persists it (P3).
