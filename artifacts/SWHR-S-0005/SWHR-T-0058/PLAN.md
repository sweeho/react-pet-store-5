# SWHR-T-0058 — Catalog queries

Change `swhr-i-0006-catalog-browsing-and-search`, tasks.md group 2. Read `openspec/changes/swhr-i-0006-catalog-browsing-and-search/design.md` first (D3, D4, P1, P2, Q1, Q3, Q8). Depends on SWHR-T-0061 (legacy seed).

## Objective

Every read the storefront needs — category list, one category, products of a category, items of a product, one item, keyword search — is a locale-scoped, ordered, paged function in `lib/catalog/`.

## Design reference

No UI. `artifacts/SWHR-S-0005/design/` shows what each listing must supply (name, description, prices, attributes).

## Steps

1. `lib/catalog/paging.ts` (new): `DEFAULT_PAGE_SIZE`, `PageInfo`, and a helper that turns `count + 1` fetched rows into `{ items, paging }` (P1).
2. `lib/catalog/errors.ts` (new): `CatalogError extends Error` carrying the underlying message (P2). Every exported query catches a store failure and rethrows it as `CatalogError`; no retry.
3. `lib/catalog/queries.ts`: add `listCategories`, `getCategory`, `listProducts`, `listItems`, `parseKeywords`, `searchItems`. Extend `ItemView` additively. Keep `getProduct`, `getItem` and `listProductItems` working for their current callers.
4. Every item read inner-joins item details AND product details in the same locale (existing rule), and joins `product` for `categoryId` (D4: correct ids).
5. Ordering (Q8): categories and products by localized name, then id; items and search results by item id.
6. Search (D3, Q1): whitespace split, de-duplicate, blank → empty page without querying. One OR group per keyword over `lower(productDetails.name)`, `lower(product.categoryId)`, `lower(itemDetails.description)` with `LIKE '%kw%'`, keyword lower-cased. Escape `%` and `_` in keywords. Use drizzle's `sql`/`like` helpers, no raw SQL strings.
7. `lib/catalog/queries.test.ts`: one named test per AC. Paging scenarios use an in-test fixture product with 5 items; REPTILES-without-zh_CN uses an in-test fixture; the rest use the seed.

## File/module ownership

- `lib/catalog/queries.ts`, `lib/catalog/queries.test.ts`
- `lib/catalog/paging.ts`, `lib/catalog/paging.test.ts` — new
- `lib/catalog/errors.ts` — new

## Interface contracts (fixed — SWHR-T-0059/0060/0062 code against these)

```ts
// lib/catalog/paging.ts
export const DEFAULT_PAGE_SIZE = 2;
export interface PageInfo { start: number; count: number; hasNext: boolean; nextStart: number | null; hasPrevious: boolean; previousStart: number | null }
export interface Page<T> { items: T[]; paging: PageInfo }
// lib/catalog/queries.ts
export interface CategoryView { categoryId: string; name: string; description: string | null; image: string | null; locale: LocaleId }
export interface ItemView { itemId: string; productId: string; categoryId: string; productName: string; name: string; description: string; image: string; attributes: (string | null)[] /* always length 5 */; listPrice: number; unitCost: number; locale: LocaleId }
// signatures (locale: LocaleId, start/count: number)
listCategories(locale): CategoryView[]
getCategory(categoryId, locale): CategoryView | null
listProducts(categoryId, locale, start, count): Page<ProductView>
listItems(productId, locale, start, count): Page<ItemView>
getItem(itemId, locale): ItemView | null
parseKeywords(query: string): string[]
searchItems(query, locale, start, count): Page<ItemView> & { keywords: string[] }
// lib/catalog/errors.ts
export class CatalogError extends Error {}
```

Prices stay integer minor units.

## Definition of Done

AC-1 … AC-20 on the ticket, each proven by a named test; existing callers of `getProduct`/`getItem`/`listProductItems` still pass.
