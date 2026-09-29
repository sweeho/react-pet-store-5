---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0008
idea: SWHR-I-0007
branch: vortex/sprint/swhr-s-0008-ca237af7
upstream: [artifacts/SWHR-S-0008/qa-test-report.md, artifacts/SWHR-S-0008/sprint-summary.md]
---

# Release notes — SWHR-S-0008

## Added

- **Create an account.** A new shopper chooses a user name and password, then fills in one form with three parts. Contact details and address, a credit card (number, type, expiry month and year), and a profile (language, favourite category, My List and pet tips). English and Birds are preselected, and every choice comes from a fixed list. (SWHR-T-0082, SWHR-T-0083, SWHR-T-0085)
- **Blank fields are named before anything is saved.** Examples are "First Name is empty." and "City is empty.", and a field holding only spaces counts as blank. The server applies the same check. (SWHR-T-0082, SWHR-T-0083)
- **Account page.** **Account** in the header opens a read-only overview. It shows contact details, card type, masked card number and expiry, language, favourite category, and Yes or No for My List and pet tips. (SWHR-T-0083)
- **Edit account.** The same form opens with the stored values selected. Saving replaces everything except the user name and password, and applies the chosen language. (SWHR-T-0082, SWHR-T-0083)
- **My List.** With My List on, a panel under the Pets menu lists up to 10 products from the favourite category, each linking to its product page. (SWHR-T-0084)
- **Pet-tips banner.** With pet tips on, home and cart show the favourite category's banner, or the dogs banner if that category has none of its own. (SWHR-T-0084)

## Changed

- Registration (`POST /api/customers`) now takes the full account form and creates the customer, account, contact information, address, card and profile in one transaction. If any part fails, nothing is created. New endpoints are `GET /api/account` and `PUT /api/account`, which work only on the signed-in user's own account. (SWHR-T-0081, SWHR-T-0082)
- The creation form now preselects English instead of the session language. The saved language still becomes the session language. (SWHR-T-0083)

## Security

- Card numbers are never stored or shown in full. Only the last four digits are kept, and they are displayed as `•••• •••• •••• 1234`. When editing, leaving the masked number unchanged keeps the stored card. (SWHR-T-0080, SWHR-T-0085)

## Upgrade notes

- There is a new migration, `drizzle/0006_parched_may_parker.sql`. It adds `accounts`, `contact_infos`, `addresses` and `credit_cards`, extends `profiles` with favourite category, My List and banner preferences, and moves the `profiles` foreign key to `customers` with cascading delete. Existing profiles keep their language, and the new preferences default to on.
- A database created before SWHR-S-0005 may fail on the earlier migration 0005 (SWHR-T-0087) before it reaches 0006. Fresh databases are unaffected.

## Known issues

- SWHR-T-0087 — migration 0005 fails on an existing database.
- SWHR-T-0072 — the Playwright browser revision does not match agent and QA containers, so the stock E2E preflight fails there.
- SWHR-T-0070 — the platform's test-evidence runner cannot validate E2E-level test cases.
- Last-four card storage is a provisional decision awaiting human confirmation before checkout builds on it.

## Verification

Verified at integration QA with a PASS verdict. All 39 customer-account scenarios pass, as do 706 unit and integration tests, lint and typecheck. All 59 Chromium E2E tests pass, including account creation, account editing and personalisation. See [qa-test-report.md](qa-test-report.md).

## Compliance / Control Evidence

| Control                      | Evidence        | Location                                         | Status    | Exception |
| ---------------------------- | --------------- | ------------------------------------------------ | --------- | --------- |
| Release contents recorded    | this file       | `artifacts/SWHR-S-0008/release-notes.md`         | Satisfied | —         |
| Release verified before land | QA PASS verdict | `artifacts/SWHR-S-0008/qa-test-report.md`        | Satisfied | —         |
| Known limitations disclosed  | Known issues    | this file; SWHR-T-0087, SWHR-T-0072, SWHR-T-0070 | Satisfied | —         |
