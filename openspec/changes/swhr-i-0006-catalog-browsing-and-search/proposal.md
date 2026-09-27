## Why

The legacy Java Pet Store 1.3.2 storefront lets any visitor browse a three-level catalog (category, product, item), search it by keyword and view an item's prices before adding it to the cart. That behaviour is spread across a catalog data-access component, storefront pages and a page-fragment cache, and none of it is written down. This change records the catalog-browsing behaviour the rebuild must match, extracted from the legacy source (spec extraction run SX-0001), so it can be rebuilt on the pinned Vite + Nitro + SQLite/Drizzle stack without reading the old code.

## What Changes

- Adds the `catalog-browsing` capability: the catalog data model (categories, products, items with per-locale details and two prices), read-only lookup and listing operations, locale filtering, name ordering, keyword search, paging with previous/next navigation, anonymous access, error behaviour and the optional listing cache.
- Adds the storefront surfaces that expose the catalog: the home-page category map, the category navigation menu, the category product listing, the product item listing, the item detail page and the search results page.
- Records the legacy catalog seeding facility as a requirement pending a product decision on whether the rebuild keeps it (see design.md, open question Q6).
- Flags legacy conflicts that a human must settle before the rebuild treats them as settled (search case handling, which price the product listing shows, item ordering, previous-page arithmetic, cache keying). These are listed in design.md; the spec states the behaviour the evidence supports and says so where the evidence is disputed.

## Capabilities

### New Capabilities

- `catalog-browsing`: read-only, locale-aware browsing of the pet catalog by category, product and item, keyword search, paged listings, and the storefront screens that present them.

### Modified Capabilities

None.

## Impact

- **Data model**: new Drizzle schema for `category`, `category_details`, `product`, `product_details`, `item`, `item_details` in `db/`, with a generated migration in `drizzle/`.
- **Server**: new read-only Nitro routes under `routes/api/catalog/` for categories, products, items, item detail and search.
- **SPA**: new pages under `src/pages/` for home, category, product, item and search, and a shared category navigation component.
- **Dependencies on other capabilities**: the Add to Cart control hands off to the shopping-cart capability; locale selection comes from the localization capability; the price actually charged is owned by checkout.
- **Source evidence**: `legacy-source/petstore1.3.2/src/components/catalog`, `src/apps/petstore/src/docroot/{main,sidebar,category,product,item,search}.jsp`, `CatalogDAOSQL.xml`, `populate/PopulateSQL.xml`, `src/waf/.../CacheTag.java`, `docs/using.html`, `docs/configuring.html`.
