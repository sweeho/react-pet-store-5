# Design: customer-account (extracted from Java Pet Store 1.3.2)

## Context

This change specifies the customer account capability of the legacy Java Pet Store 1.3.2 so it can be rebuilt on the pinned stack (Vite React SPA + Nitro/H3 server, SQLite via better-sqlite3/Drizzle). The requirements in `specs/customer-account/spec.md` come from 37 reconciled IR records (71 pass records across passes A and B) in `legacy-analysis/ir/_passes/`. One of them is a screen record (the account information page).

The legacy capability spans six EJB 2.0 CMP entities in four component modules plus the storefront web tier:

| Legacy module            | Entities / classes                                                                                                                       | What it contributed                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `components/customer`    | CustomerEJB, AccountEJB, ProfileEJB                                                                                                      | Customer/Account/Profile ownership, creation defaults, cascade deletes, finders |
| `components/contactinfo` | ContactInfoEJB                                                                                                                           | Contact fields, three create paths, address ownership                           |
| `components/address`     | AddressEJB                                                                                                                               | Six-field address, container-generated key                                      |
| `components/creditcard`  | CreditCardEJB                                                                                                                            | Card fields, month/year expiry split, 01/2010 fallback                          |
| `waf`                    | FormTag, InputTag                                                                                                                        | Client-side "<field> is empty." check                                           |
| `apps/petstore`          | CustomerHTMLAction, CustomerEJBAction, customer.jsp, create_customer.jsp, edit_customer.jsp, mylist.jsp, advice_banner.jsp, BannerHelper | Form handling, required fields, choice lists, account page, My List, banners    |

## Legacy implementation notes (trace pointers)

Paths below are relative to `legacy-source/petstore1.3.2/src/`.

- **Customer identity and relations**: `components/customer/src/ejb-jar.xml:53-61` (userId primary key); one-to-one CMRs at `ejb-jar.xml:239-243`, `160-176`, `199-223`, `132-144`, `100-116`. Physical tables `CustomerEJBTable`, `AccountEJBTable`, `ContactInfoEJBTable`, `AddressEJBTable`, `CreditCardEJBTable`, `ProfileEJBTable` in `apps/petstore/src/sun-j2ee-ri.xml` (lines 112, 153, 165, 222, 267, 308, 354). `ProfileEJBTable.bannerPreference`/`myListPreference` are `BOOLEAN NOT NULL`; that is the only NOT NULL constraint found for this capability.
- **Creation cascade**: `CustomerEJB.ejbPostCreate` (`CustomerEJB.java:74-88`) creates the Account with `AccountLocalHome.Active` and the Profile with the `ProfileLocalHome` defaults (`ProfileLocalHome.java:44-47`); `AccountEJB.ejbPostCreate(String)` (`AccountEJB.java:80-89`) creates blank ContactInfo and CreditCard; `ContactInfoEJB.ejbPostCreate()` (`ContactInfoEJB.java:77-91`) creates a blank Address. All under trans-attribute `Required`, which is the basis for the atomicity requirement.
- **Cascade delete**: `<cascade-delete/>` on the dependent role of each one-to-one relation, `components/customer/src/ejb-jar.xml:277-368`.
- **Seeded account path**: `AccountLocalHome.create(status, contactInfo, creditCard)`; only caller found is `AccountPopulator.java:90` (the populate tool). Contact creation from separate values + existing address is called only from `ContactInfoPopulator.java:94`.
- **Expiry split**: `CreditCardEJB.java:88-107`; fallback literals `"01"` (line 95) and `"2010"` (line 106). The web action composes `month + "/" + year` (`CustomerHTMLAction.java:175`).
- **Form handling**: `CustomerHTMLAction.java:94-253` builds ContactInfo / CreditCard / ProfileInfo for `createcustomer.do` and `customer.do` (action=create|update); `CustomerEJBAction.java:83-141` creates the customer then deep-copies every field.
- **Choice lists**: `create_customer.jsp:89-202`, `edit_customer.jsp:163, 229-283`.
- **Client-side empty check**: `waf/src/view/taglibs/.../FormTag.java:84-111` emits `validate_<form>()` bound to onSubmit; `InputTag.java:80-84` registers validated fields. Used by sign-on, account and checkout forms.
- **Account page**: `customer.jsp:120-214`, links to `update_customer.screen`; edit form posts `action=update` to `customer.do` (`edit_customer.jsp:49-50`, `WEB-INF/mappings.xml:97-99`).
- **My List**: `mylist.jsp:59-100` (start=0, count=10, categoryId=favoriteCategory); panel is included on most screens except checkout, sign-on, sign-off and error (`screendefinitions_en_US.xml:137-143`).
- **Banner**: `advice_banner.jsp:59-72`, `BannerHelper.java:55-73`; defined only for the main and cart screens (`screendefinitions_en_US.xml:51, 62`).
- **Access control**: every method on all six beans is `<unchecked/>` with `use-caller-identity` (`components/customer/src/ejb-jar.xml:371-399`, `contactinfo/src/ejb-jar.xml:150-159`, `address/src/ejb-jar.xml:81-95`, `creditcard/src/ejb-jar.xml:76-82`).

## Mapping to the pinned stack

- **Data model** (`db/schema.ts`, migration generated into `drizzle/` by `db-generate`): tables `customers` (PK `user_id`), `accounts` (status, FK contact_info_id, FK credit_card_id), `profiles` (preferred_language, favorite_category nullable, my_list_preference NOT NULL, banner_preference NOT NULL), `contact_infos` (given_name, family_name, telephone, email, FK address_id), `addresses` (six text columns, integer autoincrement PK), `credit_cards` (card_number, card_type, expiry_date text, integer autoincrement PK). One-to-one ownership is expressed with unique FKs; cascade deletion with `onDelete: "cascade"` in the direction the spec states (the FK lives on the parent side in legacy, so the rebuild either moves the FK to the child or deletes children explicitly in the same transaction).
- **Creation atomicity**: a single better-sqlite3 transaction wrapping customer, account, contact, address, card and profile inserts.
- **Server routes** (Nitro, `routes/api/`): account read, account create (registration) and account update for the signed-on user; a customer lookup/list for internal use. Authorisation (signed-on user may only read/update their own account) lives in the route layer, per the "enforced by the caller" requirement; sign-on itself belongs to another capability.
- **SPA pages** (`src/pages/`): account information page, account create form, account edit form; My List panel and pet-tips banner as components included by storefront layouts.
- **Naming**: legacy uses `telephone` in storage and `phone` in value objects/XML; the rebuild uses `telephone` only.

## Decisions

- **D1** The spec states the legacy behaviour faithfully, including the 01/2010 expiry fallback and the unmasked card number on the account page, because the extraction contract is "flag, never guess". Each is listed below as an open question for a human.
- **D2** The account-form choice lists are specified as a non-screen requirement (the reconciled record is `kind: requirement`); the account information page is the single screen requirement.
- **D3** Required-field rules for card data and profile are specified per the evident intent of the legacy code (fields are collected into a missing-fields list), not per its actual effect (the list is discarded). See Q3.

## Open questions and disputed records (carry to a human)

- **Q1 Card data handling (regulated).** The card number is stored in clear text, shown unmasked on the account page and pre-filled on the edit form; the data layer has no access control. Decide storage, masking and PCI scope before building the account page and card storage. Do not copy the legacy behaviour by default.
- **Q2 Card type value mismatch.** The creation form submits `Meow Club` (label "Meow Card"); the edit form submits `Meow Card`; seed data uses `Meow Card` and `VISA`. An account created with `Meow Club` cannot be pre-selected on edit. The spec uses "Meow Card"; the authoritative list needs an owner.
- **Q3 Server-side validation defects.** In `CustomerHTMLAction` the card type, expiry month and expiry year checks all re-test the card number (the year check is labelled "Credit Card Expiry Month"); the missing-field lists from the card and profile extractors are discarded; when contact fields are missing the action returns null and processing continues into a null dereference. The intended user-facing error display is unspecified.
- **Q4 Card argument order.** `CustomerHTMLAction.java:176-178` calls `new CreditCard(number, type, expiry)` while the constructor is `(number, expiry, type)`: cards saved through the profile form may have type and expiry swapped. Confirm and do not reproduce.
- **Q5 Expiry year ranges.** 2001-2004 on the creation form, 2002-2005 on the edit form; seed data uses `MM/YY` (`04/04`) while the form composes `MM/YYYY`. The spec says "a four-year range"; a human must decide the real range (presumably relative to the current year) and the canonical format.
- **Q6 Expiry fallback.** `01`/`2010` for a missing or malformed expiry is a bare literal and is now in the past. Decide whether the rebuild should reject such a value instead.
- **Q7 Country value.** Account forms and seed data store `USA`; the checkout form uses `United States`, so a US customer's country never pre-selects on checkout.
- **Q8 Disabled accounts.** Status `disabled` is defined but never set or read; sign-on does not check status. Decide whether disabling is a real feature and what it blocks.
- **Q9 Customer deletion.** Cascade deletion is declared but no caller deletes a customer. Decide whether account deletion / data erasure is a supported operation.
- **Q10 Field constraints.** No lengths, formats (email, phone, postal code) or country/state code standard exist anywhere; email was deliberately relaxed to optional in the XML parser (`/*false*/` comment). Decide formats and whether email is required.
- **Q11 Post-registration landing.** After account creation the handler compares the session's original URL without a null check; the landing page for a user who signed up directly is unspecified.
- **Q12 Order vs account card.** CreditCardEJB is also deployed by the purchase-order component, and checkout uses a hard-coded card rather than the card on file. Whether an order copies or shares the customer's card belongs to the checkout capability but affects this data model.

## Sprint planning (SWHR-S-0008)

Added by the planning ticket SWHR-T-0077. Everything above this heading is the adopted extraction and is unchanged. Implementation agents: read this section before the legacy notes, because it records what this repository already has and the decisions the rebuild takes.

### Codebase findings

- **Stack.** The database is `bun:sqlite` through `drizzle-orm/bun-sqlite` (`db/client.ts`), with `PRAGMA foreign_keys = ON` and migrations applied on open. Transactions are `db.transaction((tx) => …)`, which is synchronous. Tables and columns are camelCase (`cartLines`, `userId`), not snake_case.
- **Already built by sign-on (swhr-i-0005).** `customers` (PK `userId` → `users`, `createdAt`) and `profiles` (PK `userId` → `users`, `preferredLanguage` default `en_US`) exist in `db/schema.ts`. `POST /api/customers` (`routes/api/customers.post.ts`) is registration step 2: it needs a pending registration session, inserts `customers` + `profiles` in one transaction, signs the session on, applies the preferred language, and returns `{ redirect }` (the original URL unless it is `ACCOUNT_CHANGE_PATH`, else `/`). `src/pages/register.tsx` is its minimal form (language only). Both files say this change replaces the form and extends the tables.
- **Protection.** `configs/signon-config.json` protects `/account` (customer.screen) and `/account-edit` (customer.do); `ACCOUNT_CHANGE_PATH = "/account-edit"` in `lib/auth/protection.ts`. API routes guard with `requireSignOn` and read the user through `getAuthSession(event, "storefront")`.
- **Locale.** `lib/locale/preference.ts` applies `profiles.preferredLanguage` at sign-on and on profile save (`applyPreferredLanguageOnProfileSave`). Supported locales come only from `lib/locale/model.ts`. Page copy lives in `src/i18n/screens/<screen>.ts` with `en_US`, `ja_JP`, `zh_CN` entries; `src/pages/account.tsx` is a "coming soon" placeholder on the `account` screen.
- **Catalog.** Category ids are `BIRDS`, `CATS`, `DOGS`, `FISH`, `REPTILES` (`db/seed/catalog.ts`); `listProducts(categoryId, locale, start, count)` in `lib/catalog/queries.ts` returns a `Page<ProductView>`. `PetsMenu` (`src/components/layout/PetsMenu.tsx`) is the left column on home, search, category, product and item pages; the cart page has no left column.
- **Forms.** `src/components/forms/StateProvinceSelect.tsx` and `lib/locale/stateProvince.ts` give locale-specific state lists for the _order_ form (localization spec).
- **Name clash.** `lib/b2b/elements/{address,contactInfo,creditCard}.ts` are XML document element codecs for partner documents, not storage. Do not reuse or change them; the account model lives in `lib/account/`.
- **Tests.** Vitest's `server` project already covers `lib/**`, `routes/**`, `middleware/**` (in-memory db per module). Playwright runs on :5178 with a fresh `SQLITE_PATH` database per run. `lib/auth/scenarios/coverage.test.ts` is the pattern for a self-checking approved-case coverage test. `e2e/sign-on.spec.ts` drives the current registration form and must move to the new one.
- **CI.** `.github/workflows/ci.yml` runs on push and pull request to `vortex/**`, `dev`, `main`; it runs lint, typecheck, unit (JUnit evidence) and build. No change is needed.

### Planning decisions

- **P1 Extend, do not recreate.** `customers` keeps its shape. `profiles` gains `favoriteCategory` (nullable text), `myListPreference` and `bannerPreference` (integer boolean, NOT NULL, default true), and its `userId` FK moves from `users` to `customers` with `onDelete: "cascade"`. Rows written by sign-on keep working. Tasks 1.1 and 1.6 therefore mean "extend".
- **P2 Foreign keys on the child side, with real cascades.** `accounts.userId` → `customers` (unique, cascade); `contactInfos.accountId` → `accounts` (unique, nullable, cascade); `creditCards.accountId` → `accounts` (unique, nullable, cascade); `addresses.contactInfoId` → `contactInfos` (unique, nullable, cascade). Nullable owner columns let an address, card or contact exist before it is attached (R-0111, R-0112, R-0120, R-0121). "Link existing address A" (R-0121.02) sets A's `contactInfoId`. This answers the open FK-direction note under _Mapping to the pinned stack_.
- **P3 Card numbers are not stored in full (answers Q1, provisionally).** PRD constraint 6: "Card numbers must not be stored or shown in full." The card record keeps `cardLastFour` (text), `cardType` and `expiryDate`; the full number is never written or logged. The account page and edit form show `•••• •••• •••• 1111`, as both mockups draw it. On edit, a blank or unchanged masked card-number field keeps the stored digits; a new number replaces them. Checkout (swhr-i-0009) treats "the card on the account" as type + last four + expiry. A human should confirm this against the canvas's other option (a token).
- **P4 Reference lists (answers Q2, Q5, Q7).** Card types `Java(TM) Card`, `Duke Express`, `Meow Card`, value = label (the legacy `Meow Club` is not reproduced). Expiry years: the current year and the next three; a stored year outside that range is added so it can still be preselected. Expiry is stored as `MM/YYYY`. Countries `United States`, `Canada`, `Japan`, `China` (label = value, matching checkout). States `California`, `New York`, `Texas` on every locale, per R-0127. Favourite categories are submitted and stored as catalog ids (`BIRDS` … `REPTILES`) and shown by the catalog's localized name. Languages come from `SUPPORTED_LOCALES`. All of it is in `lib/account/reference.ts`.
- **P5 Expiry fallback kept (Q6).** `01`/`2010` stays, because R-0114 specifies it. The form always composes `MM/YYYY`, so the fallback is reached only by bad stored data.
- **P6 Server validation (Q3, Q4, canvas "two checks, two messages").** One server-side validator, `lib/account/form.ts`, trims every field and reports every missing required field at once: the seven contact fields, card number (create only), card type, expiry month and year, language and favourite category. The response is `400 { missing: AccountField[] }`. The form shows the same `"<Field name> is empty."` wording beside each field, on the form, never on an error page. The legacy argument-order bug is not reproduced.
- **P7 Scope answers from the canvas (Q8, Q9, Q10).** `disabled` is storable but has no effect. Customer deletion is a domain function with no route. Fields are checked only for "not blank".
- **P8 Routes.** `GET /api/account` returns the signed-on user's account (masked card). `PUT /api/account` replaces contact, address, card and profile, then applies the preferred language via `applyPreferredLanguageOnProfileSave`. Registration stays `POST /api/customers`, which now takes the full form and calls the domain's atomic creation, then writes the submitted values in the same transaction. The user id always comes from the session, never the body. Page routes: `/account` (overview), `/account-edit` (edit form, already protected), `/register` (creation form).
- **P9 Language default on the creation form.** English is preselected (R-0127.01), replacing the current default of the session locale. The saved language still becomes the session locale on submit.
- **P10 Personalisation placement.** My List renders inside the `PetsMenu` column, below the categories, on every page that has that column. The pet-tips banner renders on home and cart only. Both read the profile from `GET /api/account` through one `useAccount` hook, and neither renders for an anonymous visitor. My List fetches the favourite category's first 10 products through the existing catalog category route (`start=0&count=10`). Banner copy is page copy in `src/i18n/screens/pet-tips.ts`, one entry per category in all three locales, with the dogs entry as the fallback.

### Phases

1. **Open questions → reference data** (SWHR-T-0085): masking helper and reference lists. It goes first because P3 fixes the card columns.
2. **Data model** (SWHR-T-0080): schema extension, new tables, cascades, migration.
3. **Domain services** (SWHR-T-0081): `lib/account/` creation, lookups, contact paths, field-level access, expiry.
4. **Server routes and validation** (SWHR-T-0082).
5. **Account screens** (SWHR-T-0083): overview, create and edit forms, empty-field check, register journey migration.
6. **Personalisation** (SWHR-T-0084): My List and pet-tips banner.
7. **Test harness** (SWHR-T-0086): each implementing ticket writes the approved `SWHR-C-*` cases for its own scenarios, named with the case id. This ticket adds `lib/account/scenarios/coverage.test.ts` (mirroring `lib/auth/scenarios/coverage.test.ts`, including the archive-path lookup) and the Playwright journeys. It adds no new Vitest project or config: `lib/**` and `routes/**` already run in the `server` project.
8. **CI**: `.github/workflows/ci.yml` already triggers on `vortex/**` pushes and pull requests and runs lint, typecheck, unit and build. Nothing to change; the new tests join the existing jobs, and the Playwright specs run in Validation's E2E pass.

## Spec discrepancies

Recorded, not applied: the delta spec above is unchanged.

- **SD1 Driver.** _Context_ and _Mapping_ name better-sqlite3; the repository uses `bun:sqlite` through `drizzle-orm/bun-sqlite`. Code follows the repository.
- **SD2 Tables already exist.** Tasks 1.1 and 1.6 say "define" `customers` and `profiles`; both exist (sign-on P8), keyed by `userId` → `users`. See P1.
- **SD3 Naming.** _Mapping_ uses snake_case (`user_id`, `contact_infos`, `credit_cards`); `db/schema.ts` uses camelCase throughout. Code follows the repository.
- **SD4 Card number in full.** R-0112 stores a card number and R-0131.01 shows "the card type and card number". PRD constraint 6 forbids both in full, and the overview and edit mockups show `•••• •••• •••• 1111` ("Stored card shown masked"). The rebuild follows P3. R-0112.01 still holds (two records, different identities). R-0131.01 is met by showing the masked number.
- **SD5 Registration language default.** Current code preselects the session locale on `/register`; R-0127.01 requires English. The spec wins (P9).
- **SD6 State list.** R-0127 fixes California, New York and Texas; the localization spec gives the _order_ form locale-specific lists. They are different forms, so both hold. The account form must not reuse `StateProvinceSelect` (P4).
- **SD7 Favourite category values.** The spec names categories by label ("Cats", "Fish") and matches banners case-insensitively ("CATS"); the catalog's ids are upper-case (`CATS`). Storing the id satisfies both (P4).
- **SD8 Required card fields.** D3 makes card fields required "per evident intent"; R-0125 lists only contact fields as required, and R-0126 lists language and favourite category. P6 also requires card number (on create), type, month and year. No scenario contradicts this; a human may relax it.
- **SD9 Account page year in the scenario.** R-0131.01 uses expiry `07/2004`, outside any current four-year range. Display is unaffected; the edit form keeps the stored year selectable (P4).
