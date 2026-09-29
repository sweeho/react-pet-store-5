# SWHR-T-0060 — Storefront catalog screens

Change `swhr-i-0006-catalog-browsing-and-search`, tasks.md group 4. Read `openspec/changes/swhr-i-0006-catalog-browsing-and-search/design.md` first (P5, SD7, SD9, SD10, Q4, Q7). Depends on SWHR-T-0059 (routes).

## Objective

A shopper reaches every catalog screen from the home map or the Pets panel, pages through listings two at a time, and adds an item to the cart from the product, item and search screens.

## Design reference

Build what the mockups show; the wireframes carry the same structure with annotations. All under `artifacts/SWHR-S-0005/design/` (index `MANIFEST.md`):

- `mockup-home-pet-picture-map.html` — home: "Choose a pet to start" map with one region per category
- `mockup-category-product-listing-first-page.html`, `mockup-category-product-listing-no-products.html`
- `mockup-product-item-listing-middle-page.html` — Previous and Next both shown
- `mockup-item-detail.html` — breadcrumb, id, title, description, List Price / Your Price, Add to Cart
- `mockup-search-results-matches.html`, `mockup-search-results-no-results.html`
- `mockup-catalog-unavailable-error.html` — the Error state frame on a 503
- Every mockup shows the Pets side panel (232 px, heading "Pets", current category highlighted) left of `main` from `lg` up.

## Steps

1. `src/hooks/useCatalogCategories.ts` (new): fetches `GET /api/catalog/categories` for the session locale, refetching when the locale changes.
2. Pets panel (P5): `src/components/layout/PetsMenu.tsx` (new), rendered by `SiteLayout` on storefront pages, fed by the hook, ordered as returned. In the mobile panel the same entries appear under a "Pets" heading. Remove the static category row from `GlobalNav`; keep `PRIMARY_AREAS` for the non-catalog areas. `PET_CATEGORIES` may remain only as the home map's fixed region list (id → icon/picture), never as a source of labels.
3. Home (`src/pages/index.tsx`): the picture map — one region per category the API returns, each linking to `/category/<ID>`, no other destinations inside the map.
4. `src/pages/category/[categoryId].tsx`: products A–Z, name linking to `/product/<id>`, description, Previous/Next (P1 `paging`), empty state for no products.
5. `src/pages/product/[productId].tsx`: rows link title (`name`) to `/item/<id>`, description, list price (Q7), Add to Cart, Previous/Next.
6. `src/pages/item/[itemId].tsx` (new): title, `<img src="/images/<image>" alt="<title>">`, "List Price" and "Your Price" formatted with `formatPrice`, Add to Cart.
7. `src/pages/search.tsx`: "Items matching any of: <keywords>", rows with title link, description, unit cost (Q7), Add to Cart, Previous/Next; "No results were found for your search." for an empty field or no match.
8. Add to Cart (4.7): one shared control, `src/components/catalog/AddToCartButton.tsx` (new), POSTing `{ itemId }` to `/api/cart/items`; used by product, item and search pages.
9. Paging links: one shared `src/components/catalog/PagingLinks.tsx` (new) rendering Previous only when `hasPrevious`, Next only when `hasNext`, as links carrying `start`/`count`. Missing parameters mean `start=0`, `count=2`.
10. Every fetching page uses `AsyncContent`; a 503 renders the Error frame with Try again.
11. Copy: all new strings in the matching `src/i18n/screens/*.ts` (add `item.ts`) for en_US, ja_JP, zh_CN.
12. `public/images/{birds,cats,dogs,fish,reptiles}.svg` (SD10): simple single-colour pet silhouettes.
13. Tests: a UI test next to each page and new component (fetch mocked), `SiteLayout.test.tsx` updated for the Pets panel, and `e2e/catalog-browsing.spec.ts`: Home → Dogs → Bulldog → Male Adult Bulldog → Add to Cart, the Fish region, a Next link on DOGS, and a "bulldog" / "zebra" search.

## File/module ownership

- `src/pages/index.tsx`, `src/pages/category/[categoryId].tsx`, `src/pages/product/[productId].tsx`, `src/pages/item/[itemId].tsx`, `src/pages/search.tsx` and their `*.test.tsx`
- `src/components/layout/GlobalNav.tsx`, `SiteLayout.tsx`, `SiteLayout.test.tsx`, `PetsMenu.tsx` (+ test)
- `src/components/catalog/**` — new
- `src/hooks/useCatalogCategories.ts` (+ test), `src/hooks/index.ts`
- `src/constants/navigation.ts`
- `src/i18n/screens/{home,category,product,item,search,shell}.ts`, `src/i18n/screens.ts`
- `public/images/*.svg` — new
- `e2e/catalog-browsing.spec.ts` — new

## Interface contracts (fixed)

Consumes SWHR-T-0059's routes as specified there; page URLs are `/category/:categoryId`, `/product/:productId`, `/item/:itemId`, `/search?keywords=`, each accepting `start` and `count`.

## Definition of Done

AC-1 … AC-14 on the ticket, each proven by a named UI test or by `e2e/catalog-browsing.spec.ts`; every screen matches its mockup's structure and uses tokens, not the mockups' hex values.
