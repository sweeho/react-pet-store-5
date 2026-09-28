---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0002
idea: SWHR-I-0003
branch: vortex/sprint/swhr-s-0002-a6c70702
upstream: [artifacts/SWHR-S-0002/qa-test-report.md]
---

# Release notes — SWHR-S-0002

## Added

- The storefront is available in US English, Japanese and Simplified Chinese. New visitors start in US English. (SWHR-T-0013, SWHR-T-0014)
- The language buttons in the header and the mobile menu switch language and keep you on the same page. (SWHR-T-0018)
- A Language screen, linked from the footer, offers US English, German, Japanese and Simplified Chinese with a Change Locale button and a confirmation page. An unrecognised language code shows "Unable to change language to …" and nothing changes. (SWHR-T-0020)
- Every existing page has its text in all three languages. A page not translated into the current language is shown in English, and a page that exists in no language shows an error page. (SWHR-T-0018)
- Product pages show each pet's name, description, image and price from that language's own catalogue, in local currency style ($18.50 / ￥2,000 / ¥120.00) with no conversion. A pet with no entry in the current language is not shown. (SWHR-T-0019)
- Cart item details follow the cart's language, which is US English until you switch. (SWHR-T-0014, SWHR-T-0019)
- A customer's stored preferred language (default US English) can be applied at sign-in and profile save, once those screens exist. (SWHR-T-0017)
- Orders default to US English, and approval, shipment and completion e-mails can be rendered in the order's language with `$1,234.50` or `￥2,000` prices. (SWHR-T-0015)
- State/province choices match the language: California, New York, Texas; 東京, 大阪, 長野; 北京, 上海, 江苏. (SWHR-T-0016)
- Japanese and Chinese names are stored and shown back without corruption. (SWHR-T-0016)
- The admin page shows its labels in German when the browser language is German, and in English otherwise. (SWHR-T-0016)

## Upgrade notes

- Two database migrations: `drizzle/0001_glamorous_supernaut.sql` (customer profiles) and `drizzle/0002_gray_the_hood.sql` (locale-keyed catalog). They apply automatically at startup, and the catalog is seeded in all three languages when empty.
- `SESSION_PASSWORD` **must be set in production**; the server throws without it. Outside production it falls back to a fixed development value.
- `DEFAULT_LOCALE` optionally sets the store's default language; unset means `en_US`.

## Not included

- The pet-category and area labels in the navigation bar, mobile menu and home "Shop by pet" grid are still English in every language (SWHR-T-0023).
- There are no sign-in, profile, order-form or checkout screens yet, and e-mails are not sent. Preferred language, state/province choices, order language and localized e-mails are built and tested, but no screen uses them yet.
- German is offered only on the Language screen and the admin page; the storefront itself does not support German (PRODUCT.md open question 4).

## Verification

Verified at integration QA: 35/35 scenarios, 151 unit tests and 28/28 E2E tests pass. See [qa-test-report.md](qa-test-report.md) (PASS).

## Compliance / Control Evidence

| Control                      | Evidence             | Location                                  | Status    | Exception |
| ---------------------------- | -------------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded    | this file            | `artifacts/SWHR-S-0002/release-notes.md`  | Satisfied | —         |
| Release verified before land | QA PASS verdict      | `artifacts/SWHR-S-0002/qa-test-report.md` | Satisfied | —         |
| Known limitations disclosed  | Not included section | this file; SWHR-T-0023                    | Satisfied | —         |
