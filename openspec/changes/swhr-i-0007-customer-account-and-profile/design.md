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
