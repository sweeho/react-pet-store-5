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
