---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0002
ticket: SWHR-T-0019
branch: vortex/feat/SWHR-T-0019-catalog-and-prices-locale-keyed-catalog-3059d249
upstream: [artifacts/SWHR-S-0002/SWHR-T-0019/PLAN.md]
---

# TDD result — SWHR-T-0019

## Test cases

| Test                                                                                                                                            | Covers                | Intent                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------- |
| `lib/catalog/queries.test.ts › getProduct › [AC-2] returns the Japanese name, description and image for an item shown in ja_JP`                 | AC-2 (SWHR-R-0014.01) | ja_JP product row is returned for a product with both en_US and ja_JP details                            |
| `lib/catalog/queries.test.ts › getProduct › [AC-3] reports not found for a product whose details exist only in en_US, requested in zh_CN`       | AC-3 (SWHR-R-0014.02) | POODLE (en_US only) requested in zh_CN → `null`, no English substitute                                   |
| `lib/catalog/queries.test.ts › getProduct › reports not found for that same product requested in ja_JP`                                         | AC-3 backdrop         | Same rule holds for ja_JP too                                                                            |
| `lib/catalog/queries.test.ts › getProduct › returns null for a product id that doesn't exist at all`                                            | SWHR-R-0014 backdrop  | Unknown id is "not found", not an error                                                                  |
| `lib/catalog/queries.test.ts › listProductItems › [AC-2] returns Japanese item details for BULLDOG in ja_JP`                                    | AC-2                  | Both seeded Bulldog items (EST-6, EST-7) list in ja_JP                                                   |
| `lib/catalog/queries.test.ts › listProductItems › [AC-4] excludes an item whose product lacks the requested locale`                             | AC-4 (SWHR-R-0014.03) | EST-9 (DALMATIAN) has ja_JP item details but its product has none — excluded from a ja_JP listing        |
| `lib/catalog/queries.test.ts › listProductItems › includes that same item when both product and item have details (zh_CN)`                      | AC-4 backdrop         | The same item lists normally in a locale its product does have                                           |
| `lib/catalog/queries.test.ts › listProductItems › returns an empty list for a product with no items in a locale it does have`                   | SWHR-R-0014 backdrop  | POODLE has no items seeded for zh_CN                                                                     |
| `lib/catalog/queries.test.ts › getItem › [AC-5] en_US list price is 1850 minor units (18.50) and ja_JP is 2000 (no conversion)`                 | AC-5 (SWHR-R-0015.01) | Same item's two locale rows carry their own, unconverted prices                                          |
| `lib/catalog/queries.test.ts › getItem › [AC-4] returns null for an item whose product lacks the requested locale`                              | AC-4                  | Single-item lookup obeys the same no-fallback join as the list query                                     |
| `lib/catalog/queries.test.ts › getItem › returns the item when its product has that locale too`                                                 | AC-4 backdrop         | EST-9 in zh_CN succeeds                                                                                  |
| `lib/catalog/queries.test.ts › getItem › returns null for an item id that doesn't exist`                                                        | backdrop              | Unknown id is "not found"                                                                                |
| `lib/locale/money.test.ts › formatPrice › [AC-5] formats 1850 minor units as $18.50 in US currency format for en_US`                            | AC-5                  | US format, cents divisor                                                                                 |
| `lib/locale/money.test.ts › formatPrice › [AC-5] formats 2000 minor units as ￥2,000 in Japanese currency format for ja_JP, with no conversion` | AC-5                  | JPY has no minor unit — 2000 stays 2000, not 20.00                                                       |
| `lib/locale/money.test.ts › formatPrice › formats 12000 minor units as ¥120.00 in Chinese currency format for zh_CN`                            | AC-5 backdrop         | CNY format matches the mockup's `¥120.00`                                                                |
| `lib/locale/money.test.ts › formatPrice › falls back to US currency format for an unsupported locale`                                           | PLAN step 4           | An unrecognized locale doesn't throw or mis-format                                                       |
| `lib/catalog/cart.test.ts › getCartItemDetails › [AC-6] uses the en_US catalog details for a cart whose locale has never been set`              | AC-6 (SWHR-R-0016.01) | Default cart locale is en_US (T-0014's `getCartLocale` default)                                          |
| `lib/catalog/cart.test.ts › getCartItemDetails › uses the cart's locale once it has been set by a switch`                                       | AC-6 backdrop / P5    | `setSessionLocale` moves the cart locale too (T-0014) — cart items follow it                             |
| `lib/catalog/cart.test.ts › getCartItemDetails › omits an item id that has no details in the cart's locale`                                     | SWHR-R-0014 backdrop  | Same no-fallback rule applies to cart lookups                                                            |
| `routes/api/catalog/products/[productId].test.ts › [AC-2] returns Japanese name, description, image and price when context.locale is ja_JP`     | AC-2                  | End-to-end through the route, not just the query layer                                                   |
| `routes/api/catalog/products/[productId].test.ts › a parseable ?locale= query overrides the session locale for this request`                    | PLAN step 5 / D3      | `?locale=zh_CN` wins over `context.locale=en_US`                                                         |
| `routes/api/catalog/products/[productId].test.ts › an unparseable ?locale= query is ignored, falling back to the session locale`                | PLAN step 5           | `?locale=ja` (unparseable) doesn't override `context.locale=ja_JP`                                       |
| `routes/api/catalog/products/[productId].test.ts › [AC-3] responds 404 for a product with no details in the requested locale`                   | AC-3                  | Route surfaces the query layer's `null` as HTTP 404                                                      |
| `routes/api/catalog/products/[productId].test.ts › responds 404 for a product id that doesn't exist`                                            | backdrop              | Same for an unknown id                                                                                   |
| `src/pages/product/[productId].test.tsx › [AC-2] renders the product name, item name and formatted en_US price`                                 | AC-2, AC-5            | Page renders fetched en_US content and `$18.50`                                                          |
| `src/pages/product/[productId].test.tsx › [AC-5] renders the Japanese content and the Japanese-format price with no conversion`                 | AC-2, AC-5            | `?locale=ja_JP` renders Japanese name/price `￥2,000`                                                    |
| `src/pages/product/[productId].test.tsx › [AC-3] shows the not-found frame, not English content, for a locale with no details`                  | AC-3                  | 404 response renders the not-found screen, not a substituted product                                     |
| `e2e/product-locale.spec.ts › [SWHR-R-0008.01] switching language on the product page re-renders it in Japanese and moves the cart locale`      | AC-1 (SWHR-R-0008.01) | Real browser: same URL, Japanese content after the switch, `GET /api/locale` reads `cartLocale: "ja_JP"` |

## Red run

`NODE_ENV=test bun --bun vitest run lib/catalog lib/locale/money.test.ts routes/api/catalog src/pages/product`, run with `db/schema.ts`/`db/client.ts` reverted to their pre-ticket state, the migration removed, and `db/seed/catalog.ts`, `lib/catalog/{queries,cart}.ts`, `lib/locale/money.ts`, `routes/api/catalog/products/[productId].get.ts`, `src/i18n/screens/product.ts` and `src/pages/product/[productId].tsx` all removed (temporarily, from a backup copy — not re-authored):

```
FAIL  |server| lib/catalog/cart.test.ts — Cannot find module './cart'
FAIL  |server| lib/catalog/queries.test.ts — Cannot find module './queries'
FAIL  |server| lib/locale/money.test.ts — Cannot find module './money'
FAIL  |server| routes/api/catalog/products/[productId].test.ts — Cannot find module './[productId].get'
FAIL  |client| src/pages/product/[productId].test.tsx — Failed to resolve import "./[productId]"

 Test Files  5 failed (5)
      Tests  no tests
```

All five suites fail to resolve their imports, confirming they exercise real modules with no implementation yet. Every file was then restored unchanged from the backup before continuing. (`e2e/product-locale.spec.ts` was not run in either phase — see Green run.)

## Green run

`bun run verify` (`bun run lint && bun run typecheck && bun run test`) — the project's full pre-commit gate. (`bun run verify:full` also ran; its `test:e2e` tier fails only because this container has no Chromium installed — the documented, expected fallback in this case is `verify` alone. `e2e/product-locale.spec.ts` is committed and syntactically type-checked via `tsc --build`, which covers `e2e/`, but has not been executed in this container; Validation runs the E2E tier at INTEGRATION_QA.)

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  39 passed (39)
      Tests  144 passed (144)
```

All 39 suites (144 tests, including the 27 new tests above) pass; lint and `tsc --build` (both TypeScript projects, `e2e` included) are clean.

TDD-RESULT: 144 passed, 0 failed
