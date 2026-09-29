## Context

This change is extracted from Java Pet Store 1.3.2 (`legacy-source/petstore1.3.2/`), spec extraction run SX-0001. The behaviour lives in three places in the legacy system:

- **Catalog component** (`src/components/catalog`): `CatalogDAO` with two implementations, `CloudscapeCatalogDAO` (hard-coded SQL) and `GenericCatalogDAO` (SQL loaded from `src/apps/petstore/src/docroot/CatalogDAOSQL.xml`). Callers reach it either directly through `CatalogHelper` (the "fast lane" default) or through the stateless `CatalogEJB`. The active DAO class and dialect (`param/CatalogDAOClass`, `param/CatalogDAODatabase` in `ejb-jar.xml` lines 60-67) are redacted in this copy of the source.
- **Storefront pages** (`src/apps/petstore/src/docroot`): `main.jsp` (home map), `sidebar.jsp` (Pets menu), `category.jsp`, `product.jsp`, `item.jsp`, `search.jsp`. Each hard-codes `en_US` in the page; the `ja/` and `zh/` subtrees carry localized copies.
- **WAF cache tag** (`src/waf/.../taglibs/smart/CacheTag.java`): wraps `category.jsp`, `product.jsp` and `sidebar.jsp` with application-scope caching for 300000 ms.

Schema evidence comes from the seeding DDL in `populate/PopulateSQL.xml` (lines 51-161), the strongest source for field sizes and constraints. Every requirement in `specs/catalog-browsing/spec.md` traces to IR records under `legacy-analysis/ir/_passes/legacy-source/petstore1.3.2/{src/components/catalog,src/apps/petstore,src/waf,docs}/{a,b,c}.yaml` with `capability_key: catalog-browsing`.

### Legacy mapping (implementation notes, not contract)

| Spec requirement                          | Legacy source                                                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog category / product / item records | `PopulateSQL.xml` 51-161; `model/Category.java`, `Product.java`, `Item.java`                                                                   |
| Locale-scoped visibility                  | inner joins on `*_details` with `locale = ?` in every query of `CatalogDAOSQL.xml` 64-127                                                      |
| Category / product listing order          | `GET_CATEGORIES`, `GET_PRODUCTS` `order by name`                                                                                               |
| Item listing                              | `GET_ITEMS` (no ORDER BY); `getItems` in both DAOs                                                                                             |
| Single entry lookup                       | `getCategory`/`getProduct`/`getItem` return null when `resultSet.first()` is false                                                             |
| Search keyword parsing                    | `StringTokenizer` into a `HashSet`, `Page.EMPTY_PAGE` when empty (CloudscapeCatalogDAO 347-354, GenericCatalogDAO 345-352)                     |
| Search keyword matching                   | `SEARCH_ITEMS`: `lower(name) like ? or lower(catid) like ? or lower(b.descn) like ?`, one OR group per keyword, bound as `%kw%`                |
| Paging                                    | `absolute(start+1)` then read while `--count > 0`; `hasNext` from the next `rs.next()`; `Page.java` 75-91                                      |
| Default page size 2                       | `category.jsp`/`product.jsp`/`search.jsp` 64-74 set `start=0`, `count=2` when `param.count` is absent; `CatalogHelper` initialises `count = 2` |
| Anonymous access                          | `ejb-jar.xml` 84-90 `<unchecked/>` on every `CatalogEJB` method                                                                                |
| Failure behaviour                         | `SQLException` wrapped as `CatalogDAOSysException`, then `EJBException` or `CatalogException`                                                  |
| Cached listings                           | `waf:cache scope="context" duration="300000"` in `category.jsp` 47, `product.jsp` 48, `sidebar.jsp` 48                                         |
| Catalog seed data                         | `PopulateServlet` 115-177, `index.jsp` 77-82, mapped at `/Populate` in `web.xml` 119-158                                                       |
| Home category map                         | `main.jsp` 44-70 image-map areas to `category.screen?category_id=...`                                                                          |
| Item detail page                          | `item.jsp` 54-81; Add to Cart posts to `cart.do?action=purchase&itemId=...`                                                                    |
| Category navigation menu                  | `sidebar.jsp` 48-83, count literal 5                                                                                                           |
| Category / product / search pages         | `category.jsp` 65-138, `product.jsp` 65-140, `search.jsp` 64-160                                                                               |

The two `kind: screen` IR records are `catalog-browsing-SCREEN-0001` (item detail) and `catalog-browsing-SCREEN-0002` (home map). Pass B's `CAT-SCR-0001..0004` duplicate these and the sidebar/category/product surfaces, which pass A recorded as `requirement` records (`catalog-browsing-REQ-0001..0004`).

## Goals / Non-Goals

**Goals:**

- Rebuild read-only catalog browsing, search and the six storefront surfaces on the pinned stack: Drizzle schema in `db/` with a migration in `drizzle/`, Nitro routes under `routes/api/catalog/`, SPA pages under `src/pages/`.
- Preserve locale filtering, name ordering, OR-of-substring search and next/previous paging semantics.
- Store money as exact decimals (integer minor units or a decimal string), not floating point.

**Non-Goals:**

- Catalog administration (create/edit/delete products). No such behaviour exists in the legacy catalog component.
- Cart contents, pricing charged at checkout and locale switching. Those belong to the shopping-cart, checkout and localization capabilities; this capability only hands off to them.
- Reproducing the two-DAO, EJB-or-direct access split. One server-side data path is enough.
- Per-locale suffixed tables (`DatabaseNames.getTableName`, `_ja`/`_zh`). This is dead code with no callers, and no requirement was emitted from it.
- `I18nUtil.parseKeywords` (locale-aware word-break tokenising). No caller exists, reachability is unresolved and the record is disputed, so no requirement was emitted. Search uses whitespace tokenising, which is what both live DAOs do.

## Decisions

- **D1 Money as exact decimals.** The DDL declares `decimal(10,2)`, but the Java layer reads prices as `double`. The spec follows the DDL. In SQLite/Drizzle, store integer cents; format as currency only in the SPA.
- **D2 Prices per locale.** `item_details` is keyed by `(itemid, locale)` and holds `listprice`/`unitcost` (DDL). One catalog-pass note says prices look locale-independent because the queries select them unqualified. The DDL is authoritative, so prices live on the details row.
- **D3 Case-insensitive search.** Cloudscape DAO lower-cases keywords and the Generic DAO does not, and which one ran is redacted. The spec takes case-insensitive, as both extraction passes recommend. This conflict is disputed; see Q1.
- **D4 Item listing returns correct identifiers.** Legacy `getItems` swaps category and product identifiers when it builds each Item (CloudscapeCatalogDAO 317-320, GenericCatalogDAO 319-322). `getItem` and `searchItems` map them correctly. The spec requires the correct mapping; see Q2.
- **D5 Cache keyed by address and locale.** The legacy cache key is URL + fragment name + query string, and it omits locale. `category.jsp` uses the fixed name `page`. The spec permits caching but requires locale and full-address keying so that no content leaks across categories, pages or locales. A rebuild MAY omit the cache entirely.
- **D6 Page size literals kept.** Page size 2 for storefront listings and 5 for the Pets menu are bare literals with low confidence. The spec records 2 because it is the observed contract. The menu requirement says "the categories available", not "up to five", because 5 only equals the seeded category count; see Q4.
- **D7 Previous-page arithmetic kept as observed.** The spec states the legacy rule (start minus rows on the current page). It is low confidence; see Q3.
- **D8 Non-positive page size.** The legacy do/while loop returns one row for page size 0 or less. The spec does not require that behaviour. Validate page size ≥ 1 at the route boundary and reject other values with 400 (see Q5).

## Risks / Trade-offs

Open questions for a human. The spec states the behaviour the evidence best supports; these must be confirmed before the rebuild treats them as settled.

- **Q1 Search case sensitivity (conflict).** Confirm case-insensitive search (D3). Also confirm that search matching the category _identifier_ rather than the localized category name is intended. As written, Japanese and Chinese shoppers can match a category only by its English identifier.
- **Q2 Swapped identifiers in item listing (conflict).** Confirm that no screen or the cart relies on the swapped values (D4).
- **Q3 Previous-page offset.** From a short last page, the previous start lands mid-page (count 10, start 20, 3 results gives start 17). Confirm whether the rebuild should instead step back by the requested page size.
- **Q4 Page sizes.** Confirm whether 2 (listings) and 5 (menu) are product decisions or demo settings.
- **Q5 Malformed paging and locale input.** `CatalogHelper.setCount` throws on non-numeric input. `getLocaleFromString` returns null for a bare language and throws for a three-part locale. Decide the rebuild's error response.
- **Q6 Seed data scope.** `/Populate` has no security constraint, and a forced reload drops and recreates the catalog tables. It was filed under catalog-browsing because no capability covers provisioning. Decide whether it exists in the rebuild and who may trigger it. If kept, it must not be reachable anonymously. `populating.jsp` also echoes the raw `forcefully` parameter into a META refresh tag, which must not be carried over.
- **Q7 Which price the product listing shows (conflict).** `product.jsp` 107 shows the list price next to Add to Cart. Search results (`search.jsp` 116) and the cart show the unit cost, and checkout charges the unit cost. The spec records the observed behaviour (product listing shows list price, search shows unit cost, item detail shows both). A shopper can therefore see one price and be charged another. Decide which price each listing shows.
- **Q8 Result ordering.** Item listings and search results have no ORDER BY in the legacy system, so paging over them can skip or repeat rows. The spec requires no order. The implementation should still apply a deterministic tiebreak (for example item identifier) so pages are stable; that choice needs confirmation.
- **Q9 Whitespace trimming.** Cloudscape `getProducts` trims name and description and Generic does not. The rebuild uses variable-length text, which makes this moot, but seeded values should be trimmed on import.
- **Q10 Seed item EST-15.** It has no ja_JP details, so it is invisible in the Japanese store under the locale-visibility requirement. Confirm this is intended.

## Sprint planning — SWHR-S-0005

Added by the planning ticket SWHR-T-0054. Everything above this heading is the adopted specification and is unchanged. This section records what the repository already has, where it disagrees with the spec, the decisions that settle the open questions, and the build order.

### Codebase findings

- **Schema exists, incomplete.** `db/schema.ts` already has `category`, `categoryDetails`, `product`, `productDetails`, `item`, `itemDetails` keyed `(id, locale)` from the localization change. Prices are integer minor units (`listPrice`, `unitCost`). Missing: the five item attributes, any length limit, and FK enforcement. `itemDetails.name` holds a composed display name ("Male Adult Bulldog").
- **Foreign keys are not enforced.** `db/client.ts` never sets `PRAGMA foreign_keys`, and bun:sqlite defaults it off, so the `references()` clauses are decorative today.
- **Seed exists, with non-legacy ids.** `db/seed/catalog.ts` seeds 5 categories and 3 DOGS products (`BULLDOG`, `POODLE`, `DALMATIAN`) with 4 items, at `db/client.ts` import when `category` is empty. EST-6 has list price = unit cost = 1850. Thirteen test/spec files reference these ids.
- **Queries exist for one path.** `lib/catalog/queries.ts` has `getProduct`, `listProductItems`, `getItem` (locale inner-joins, no ordering, no paging). `lib/catalog/cart.ts` and `lib/cart/lines.ts` consume `ItemView`.
- **One route exists.** `routes/api/catalog/products/[productId].get.ts` returns `{ product, items }` or 404, locale from `?locale=` else `event.context.locale`.
- **Screens.** `src/pages/product/[productId].tsx` lists items with list price and Add to Cart (POST `/api/cart/items`), no item links, no paging. `src/pages/category/[categoryId].tsx` and `src/pages/search.tsx` are placeholders. There is no item page. Home and the Global nav draw a static `PET_CATEGORIES` list from `src/constants/navigation.ts` with English labels. The header search submits to `/search?keywords=`.
- **Access.** `configs/signon-config.json` protects none of the catalog paths; `POST /api/cart/items` is ungated.
- **Test harness and CI.** Vitest `server` project covers `routes/**`, `lib/**`, `middleware/**` (in-memory db per module); `client` covers `src/**` (jsdom). Playwright runs on :5178 with a fresh `SQLITE_PATH` db per run, so the seed runs on every E2E run. `.github/workflows/ci.yml` already runs doc-links, typecheck, lint, unit, build and E2E on pushes and pull requests to `vortex/**`, `dev`, `main`. No CI change is needed.

### Spec discrepancies

Recorded here and as a comment on SWHR-T-0054. The delta spec is not edited.

- **SD1 Seed identifiers.** Scenarios name the legacy catalog (`K9-BD-01`, "Dalmation", `EST-15`, 6 DOGS products, FISH items, EST-6 unit cost 12.00). The repo seeds `BULLDOG`/`POODLE`/`DALMATIAN` and EST-6 unit cost 18.50. Resolution: SWHR-T-0061 replaces the seed with the legacy catalog and migrates every test that names the old ids.
- **SD2 Item attributes.** The spec requires five attributes and a title of attribute + product name. The repo has no attribute columns and stores a composed `name`. Resolution: SWHR-T-0057 adds `attr1`–`attr5`; `name` stays (cart and e-mail read it) and the seed sets it to `attr1 + " " + product name` so the two never disagree.
- **SD3 Rejected saves.** "Product referencing a missing category is rejected" cannot pass while FKs are off. Resolution: SWHR-T-0057 enables `PRAGMA foreign_keys = ON`.
- **SD4 Length limits.** The spec's 10/80/255-character limits are not enforced (SQLite `text`). Resolution: SWHR-T-0057 adds `CHECK (length(...) <= n)` constraints.
- **SD5 Money precision.** The spec says two fractional digits; the repo stores integer minor units, and JPY has none (whole yen). This follows the standing locale-keyed-data decision; en_US and zh_CN are exact to two decimals. No change.
- **SD6 Lookup "no result" vs HTTP.** The query layer returns `null` for a missing identifier or locale (spec). Over HTTP a single-entity lookup answers 404, which the SPA renders as not found; that is not a catalog error. Listings of an unknown category or product answer 200 with an empty page.
- **SD7 Navigation source.** The spec requires the Pets menu to list the categories of the current locale, ordered by localized name. The repo draws a static English list. Resolution: SWHR-T-0060 feeds the Pets menu from `GET /api/catalog/categories`.
- **SD8 Seed timing and scope.** The spec loads data "the first time the store is entered" and adds demonstration accounts and a forced reload. The repo seeds at process start when `category` is empty, before any page can be served, which meets the observable outcome. Demonstration customer accounts belong to customer-account. See P6 for the forced reload.
- **SD10 Images.** The legacy item pictures (`bulldog.gif` …) are not in this repository and `public/` has none. Resolution: the seed sets each image reference to its category's picture (`birds.svg`, `cats.svg`, `dogs.svg`, `fish.svg`, `reptiles.svg`), and SWHR-T-0060 ships those five files under `public/images/` and renders `/images/<reference>`.
- **SD9 Page routes.** Legacy `.screen` addresses are replaced by `/category/:id`, `/product/:id`, `/item/:id`, `/search?keywords=`, each taking `start` and `count` query parameters.

### Planning decisions

- **P1 Paging shape.** `lib/catalog/paging.ts` exports `DEFAULT_PAGE_SIZE = 2` and `PageInfo { start, count, hasNext, nextStart, hasPrevious, previousStart }` (`nextStart`/`previousStart` are `number | null`). A query fetches `count + 1` rows at `offset start` to set `hasNext`. `previousStart = max(0, start - rowsOnPage)` when `start > 0` and the page is not empty. A start below 0 or at/after the end yields an empty page with both flags false.
- **P2 Catalog errors.** Query functions wrap any store failure in `CatalogError` (`lib/catalog/errors.ts`, carrying the underlying message). Routes map it to HTTP 503 with `data.code = "CATALOG_ERROR"` and no partial body. No retry.
- **P3 Route input.** `start` and `count` must be integers; `count` must be at least 1. Anything else answers 400. A negative `start` is a valid request that returns an empty page (spec). Locale follows the existing product route: `?locale=` when it parses, else `event.context.locale` (Q5).
- **P4 No listing cache (D5, 5.1).** The rebuild omits the 5-minute cache: the catalog is small, SQLite reads are local, and an omitted cache satisfies both cache scenarios by construction. SWHR-T-0061 proves the two scenarios against the uncached routes.
- **P5 Pets menu and home map.** Both render from `GET /api/catalog/categories` for the session locale. The home map keeps one fixed picture region per legacy category id (the picture is fixed art); a region whose category is absent in the locale is not rendered. `src/constants/navigation.ts` keeps the non-catalog primary areas.
- **P6 Forced reload not kept (Q6, 5.2, 5.3).** Seeding stays automatic on an empty catalog. No reload endpoint is built, so nothing needs restricting. Raised as an improvement ticket for a human decision.

### Open questions settled for this sprint

- **Q1** Case-insensitive search, as D3. Matching on the category _identifier_ (not the localized name) is kept as specified; a ja_JP or zh_CN shopper matches a category only by its English identifier.
- **Q2** Item listings return the correct product and category identifiers (D4). Nothing in the repo relied on the swapped values.
- **Q3** Previous-page start is the legacy rule (start minus rows on the current page, floor 0).
- **Q4** Page size 2 for storefront listings is the product default. The Pets menu lists every category available in the locale, uncapped.
- **Q5** See P3.
- **Q7** Observed behaviour kept: product listing shows list price, search shows unit cost, item detail shows both.
- **Q8** Item listings and search results order by item identifier; category and product listings order by localized name, then identifier.
- **Q9** Seed values are trimmed.
- **Q10** EST-15 has no ja_JP details, as specified.

### Phases and build order

Each phase is one TASK. They run in sequence because each builds on the files and data of the one before.

1. **Data model** (SWHR-T-0057): attributes, length checks, FK enforcement, migration, schema tests.
2. **Seed and cache decision** (SWHR-T-0061): legacy catalog seed; every test naming old ids migrated; cache scenarios proven without a cache.
3. **Queries** (SWHR-T-0058): listings, lookups, paging, search, `CatalogError`, unit tests.
4. **Routes** (SWHR-T-0059): read-only JSON routes, input validation, 503 mapping, integration tests.
5. **Screens** (SWHR-T-0060): home map, Pets panel, category/product/item/search pages, Add to Cart wiring, UI tests and `e2e/catalog-browsing.spec.ts`.
6. **Decisions pinned** (SWHR-T-0062): `lib/catalog/decisions.test.ts` asserts each settled question.

**Test-harness phase.** No new harness. Schema and query tests go under `lib/catalog/` (server project, in-memory db); route tests next to their routes; page tests next to their pages (client project, fetch mocked); one new Playwright spec drives Home → Dogs → Bulldog → Male Adult Bulldog and a search, against the seeded catalog.

**CI phase.** No workflow change. The existing workflow already triggers on `vortex/**` pushes and pull requests and runs every tier, including E2E against the seed.
