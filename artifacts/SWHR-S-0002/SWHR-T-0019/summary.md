---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0002
ticket: SWHR-T-0019
branch: vortex/feat/SWHR-T-0019-catalog-and-prices-locale-keyed-catalog-3059d249
upstream: [artifacts/SWHR-S-0002/SWHR-T-0019/PLAN.md]
---

# Summary — SWHR-T-0019: Catalog and prices

## What changed

Locale-keyed catalog tables (design D4, P4; target shape `architecture/schema.sql`), seeded in all three locales with no cross-locale fallback anywhere in the query layer, a product page rendering per-locale prices, and cart item lookups by the cart's own locale (P5).

- `db/schema.ts`: `category`, `product`, `item`, each with a `*Details` table keyed `(id, locale)`; prices are integer minor units (SD-8). Migration generated to `drizzle/0002_gray_the_hood.sql`.
- `db/seed/catalog.ts`: the five legacy categories, a fully-localized `BULLDOG` product (items `EST-6`/`EST-7`, en_US $18.50 / ja_JP ￥2,000 / zh_CN ¥120.00 — the exact figures the price-display AC names), `POODLE` (en_US details only, to exercise "not found" at the product level) and `DALMATIAN`/`EST-9` (product has no ja_JP details even though the item does, to exercise "item whose product lacks the locale"). Called from `db/client.ts` once, guarded the same way the existing `users` seed is.
- `lib/catalog/queries.ts`: `getProduct`/`listProductItems`/`getItem`, every one filtering and joining on the same requested locale — a row missing in that locale is `null`/excluded, never substituted.
- `lib/catalog/cart.ts`: `getCartItemDetails(event, itemIds)` resolves through `getCartLocale` (T-0014), which already defaults to en_US until a switch or sign-on sets it.
- `lib/locale/money.ts`: `formatPrice(minor, locale)` via `Intl.NumberFormat`, no conversion — USD/JPY/CNY by locale, JPY's minor-unit divisor is 1 (whole yen), USD/CNY's is 100 (cents).
- `routes/api/catalog/products/[productId].get.ts`: effective locale is `?locale=` when parseable, else `event.context.locale`; 404 when the product has no details in it.
- `src/pages/product/[productId].tsx` + `src/i18n/screens/product.ts`: fetches the route above and renders the item list with `formatPrice`. `AsyncContent`'s `key` includes `productId:locale`, forcing a remount (and a fresh fetch) when the session locale changes — its own retry mechanism only reruns on `retryCount`, not on prop/locale changes, so this is what makes the product page re-render in place on a switch (SWHR-R-0008.01).
- `e2e/product-locale.spec.ts`: the product-page language-switch scenario against a real browser and session — same URL, Japanese content, and `GET /api/locale` confirming `cartLocale: "ja_JP"` afterward (the cart page itself is still a placeholder, so this is read back through the API rather than a cart UI).

## Files

- `db/schema.ts` (modified), `drizzle/0002_gray_the_hood.sql` + `drizzle/meta/{0002_snapshot.json,_journal.json}` (generated), `db/client.ts` (modified — seed call only), `db/seed/catalog.ts` (new)
- `lib/catalog/queries.ts` + `.test.ts`, `lib/catalog/cart.ts` + `.test.ts` (new)
- `lib/locale/money.ts` + `.test.ts` (new)
- `routes/api/catalog/products/[productId].get.ts` + `.test.ts` (new)
- `src/i18n/screens/product.ts`, `src/pages/product/[productId].tsx` + `.test.tsx` (new)
- `e2e/product-locale.spec.ts` (new)

## AC coverage

- AC-1 (product-page language switch, session locale + cart locale move together): `e2e/product-locale.spec.ts`.
- AC-2 (Japanese name/description/image/price returned): `lib/catalog/queries.test.ts`, `routes/.../[productId].test.ts`, `src/pages/product/[productId].test.tsx`, all `[AC-2]`.
- AC-3 (no details in requested locale → not found, no English substitute): same three files, `[AC-3]`.
- AC-4 (item whose product lacks the locale is excluded): `lib/catalog/queries.test.ts`, `[AC-4]` (both `listProductItems` and `getItem`).
- AC-5 (same item, two locales, unconverted currency formats): `lib/catalog/queries.test.ts` and `lib/locale/money.test.ts`, `[AC-5]`.
- AC-6 (cart before any locale is set uses en_US): `lib/catalog/cart.test.ts`, `[AC-6]`.

## Verification

- Red: all five new/changed test files run with `db/schema.ts`/`db/client.ts` reverted, the migration removed, and every other new implementation file removed — all five suites fail on unresolved imports.
- Green: `bun run verify` (lint + `tsc --build` + full unit suite) — 39 test files, 144 tests passed; lint and typecheck clean.
- `bun run verify:full`'s E2E tier was not run locally: this container has no Chromium installed. It DID run in CI (which has Chromium) on the first push, and caught a real bug: EST-6 and EST-7 both priced at en_US $18.50 made `page.getByText("$18.50")` match two elements (a Playwright strict-mode violation), since the spec asserts against a single item card. Fixed by giving EST-7 its own distinct seed prices (`db/seed/catalog.ts`); re-pushed and CI is green (see work log). This is a real, executed E2E pass, not a skipped tier.

Full detail: `tdd-test-result.md`.

## Notes

- Scope decision: the design mockup's "Add to Cart" button is not rendered. There is no cart-write endpoint anywhere in the repository yet (cart persistence is P5's "will persist" — a later capability), and this ticket's acceptance criteria are all read-path (catalog display, price format, cart _lookup_). A non-functional button would be a dead affordance; the product page instead renders the item list, price and not-found state the mockup and ACs actually call for.
- `ItemView.name` (the fixed interface contract) has no legacy `item_details.name` column (`architecture/schema.sql`'s `item_details` has no name field at all — only `descn`/`image`/prices/`attr1..5`). Since this is a greenfield schema per `db/schema.ts`'s own header note ("target shape", not a literal copy) and the delta spec's `ItemView` requires a name, `itemDetails` carries its own `name` column directly rather than deriving one from `attr1`/`attr2` concatenation, which the extracted records don't actually specify a format for.
