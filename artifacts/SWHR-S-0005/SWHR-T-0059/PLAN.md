# SWHR-T-0059 — Catalog server routes

Change `swhr-i-0006-catalog-browsing-and-search`, tasks.md group 3. Read `openspec/changes/swhr-i-0006-catalog-browsing-and-search/design.md` first (P2, P3, SD6). Depends on SWHR-T-0058 (query contracts).

## Objective

Read-only JSON routes expose the catalog to any caller, validate paging input, and fail whole with a catalog error when the store fails.

## Design reference

`artifacts/SWHR-S-0005/design/mockup-catalog-unavailable-error.html` is what the SPA shows on the 503 defined here.

## Steps

1. Locale resolution: reuse the pattern in `routes/api/catalog/products/[productId].get.ts` (`?locale=` when it parses, else `event.context.locale`). Extract it to `lib/catalog/request.ts` together with a `start`/`count` parser (P3: non-integer or `count < 1` → 400; missing → 0 / `DEFAULT_PAGE_SIZE`).
2. Routes (file-based, GET only):
   - `routes/api/catalog/categories/index.get.ts` → `{ categories: CategoryView[] }`
   - `routes/api/catalog/categories/[categoryId].get.ts` → `{ category: CategoryView | null, items: ProductView[], paging }` (unknown category: 200, `category: null`, empty page)
   - `routes/api/catalog/products/[productId].get.ts` → `{ product, items: ItemView[], paging }`; 404 when the product is missing in the locale (unchanged)
   - `routes/api/catalog/items/[itemId].get.ts` → `{ item: ItemView }`; 404 when missing in the locale
   - `routes/api/catalog/search.get.ts` → `{ keywords: string[], items: ItemView[], paging }` for `?keywords=`
3. Error mapping (P2): catch `CatalogError` → `createError({ statusCode: 503, statusMessage: "Catalog unavailable", data: { code: "CATALOG_ERROR", message } })`. Never return a partial body.
4. No route writes to the catalog; none reads sign-on state.
5. Integration tests with a real `H3Event`, next to each route (`routes/api/hello.test.ts` is the pattern): anonymous request succeeds for all five routes with no sign-on redirect; a mocked `CatalogError` gives 503 with no `items`; 400 on `count=0` and `start=abc`; negative `start` gives an empty page.

## File/module ownership

- `routes/api/catalog/**` (new files plus the existing product route and its test)
- `lib/catalog/request.ts`, `lib/catalog/request.test.ts` — new

## Interface contracts (fixed — SWHR-T-0060 fetches these)

The five response shapes in step 2 and the 503/400/404 behaviour in steps 1–3. `paging` is `PageInfo` from `lib/catalog/paging.ts`. Query parameters: `locale`, `start`, `count`, and `keywords` on search.

## Definition of Done

AC-1 and AC-2 on the ticket, each proven by named route tests; the product page still renders against the extended product response.
