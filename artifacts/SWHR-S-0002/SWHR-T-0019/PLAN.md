# PLAN — SWHR-T-0019 · Catalog and prices

Change `swhr-i-0003-localization` · tasks.md group 5 · Requirements: _Locale-specific catalog content_, _Locale-specific price display_, _Shopping cart locale_, and _Language switching from every page_ (product-page scenario). Read `openspec/changes/swhr-i-0003-localization/design.md` first (D4, P4, P5, SD-2, SD-8).

## Objective

Locale-keyed catalog data seeded for all three locales, queried with no cross-locale fallback, shown on a product page with per-locale prices, and looked up for the cart by the cart locale.

## Steps

1. `db/schema.ts`: `category`, `categoryDetails`, `product`, `productDetails`, `item`, `itemDetails` per `architecture/schema.sql`; `*_details` composite PK `(id, locale)`; `listPrice`/`unitCost` integer minor units (SD-8). Generate and commit the migration.
2. `db/seed/catalog.ts` called from `db/client.ts` when the catalog is empty: the legacy five categories with at least the Bulldog product (EST-6 $18.50 / ￥2,000 / ¥120.00, EST-7) in en_US, ja_JP and zh_CN, and one product with no ja_JP row to exercise not-found.
3. `lib/catalog/queries.ts`: every query takes a locale and filters by it; `getItem` joins item and product details on the same locale (D4, tasks 5.2–5.3); missing rows → `null`.
4. `lib/locale/money.ts` `formatPrice(minor, locale)` via `Intl.NumberFormat` currency style (USD/JPY/CNY by locale), no conversion.
5. `routes/api/catalog/products/[productId].get.ts`: effective locale = `?locale=` if parseable else `event.context.locale`; 404 when the product has no details in it. `lib/catalog/cart.ts` `getCartItemDetails(event, itemIds)` uses `getCartLocale`.
6. `src/pages/product/[productId].tsx` + `src/i18n/screens/product.ts` (all three locales) rendering the mockup's item table with `formatPrice`.
7. Tests: query/integration tests for the catalog ACs and cart default; UI test for price format; `e2e/product-locale.spec.ts` switching on the product page (same URL, ja_JP content, `GET /api/locale` cartLocale `ja_JP`).

## Fixed interface contract

```ts
export function getProduct(productId: string, locale: LocaleId): ProductView | null;
export function listProductItems(productId: string, locale: LocaleId): ItemView[];
export function getItem(itemId: string, locale: LocaleId): ItemView | null;
export interface ItemView {
  itemId: string;
  productId: string;
  name: string;
  description: string;
  image: string;
  listPrice: number;
  unitCost: number;
  locale: LocaleId;
} // prices in minor units
export function formatPrice(minor: number, locale: LocaleId): string;
export function getCartItemDetails(event: H3Event, itemIds: string[]): Promise<ItemView[]>;
// GET /api/catalog/products/:productId[?locale=] -> 200 { product, items } | 404
```

## File/module ownership

- `db/schema.ts`, `drizzle/`, `db/client.ts` (seed call only), `db/seed/catalog.ts` (new)
- `lib/catalog/*`, `lib/locale/money.ts` and tests (new)
- `routes/api/catalog/**` (new)
- `src/pages/product/[productId].tsx`, `src/i18n/screens/product.ts` and tests (new)
- `e2e/product-locale.spec.ts` (new)

## Definition of Done

AC-1 … AC-6 pass; seeded data is present in all three locales; no English row is returned for a ja_JP request.

## Design reference

- `artifacts/SWHR-S-0002/design/mockup-language-switch-same-page-re-rendered-in.html` — ja_JP product page layout.
- `artifacts/SWHR-S-0002/design/mockup-locale-specific-prices-and-state-provinc.html` (+ wireframe) — per-locale price strings.
