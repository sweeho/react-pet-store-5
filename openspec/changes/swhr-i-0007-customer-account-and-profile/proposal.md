## Why

The legacy Java Pet Store 1.3.2 is being rebuilt on the Vite + Nitro + SQLite stack. Its customer account behaviour (who a customer is, what an account holds, how it is created, edited, displayed and personalised) is spread across four EJB component modules and the storefront web tier and is written down nowhere. This change states it as verifiable requirements so the rebuild can match it.

## What Changes

- Add the customer data model: one customer per user id owning one account (status, contact information with postal address, credit card on file) and one profile (language, favourite category, My List and banner preferences).
- Add creation rules: account initialised "active" with empty contact, address and card; profile defaults; all-or-nothing creation; cascading deletion.
- Add account registration and update through forms, with required-field rules, choice lists and an empty-field check before submission.
- Add card expiry composition and month/year derivation, including the legacy malformed-expiry fallback.
- Add the account information page, the My List panel and the pet-tips banner driven by profile preferences.
- Record twelve open questions (card data handling, inconsistent reference lists, legacy validation defects) in `design.md` for a human decision.

## Capabilities

### New Capabilities

- `customer-account`: customer identity, account, contact information, postal address, credit card on file and profile preferences, with their creation, update, display and personalisation behaviour.

### Modified Capabilities

None.

## Impact

- `db/schema.ts` and a new migration in `drizzle/` for six tables.
- New Nitro routes under `routes/api/` for account read, create and update.
- New SPA pages under `src/pages/` for the account information page and the create/edit forms; My List and banner components used by storefront layouts.
- Depends on the sign-on capability for the signed-on user, and on the catalog capability for favourite-category products. Card data handling (Q1 in `design.md`) needs a decision before implementation.
