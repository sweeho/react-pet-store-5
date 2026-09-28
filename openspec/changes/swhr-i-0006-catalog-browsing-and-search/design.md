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
