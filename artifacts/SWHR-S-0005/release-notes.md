---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0005
idea: SWHR-I-0006
branch: vortex/sprint/swhr-s-0005-5fbe3df1
upstream: [artifacts/SWHR-S-0005/qa-test-report.md]
---

# Release notes — SWHR-S-0005

## Added

- **A real pet catalogue.** The store has five categories (Birds, Cats, Dogs, Fish, Reptiles), 16 products and 28 items in English, Japanese and Simplified Chinese. It loads automatically the first time the store opens empty. (SWHR-T-0061)
- **Home picture map.** "Choose a pet to start" shows one picture region per category, and each region opens that category. (SWHR-T-0060)
- **Pets menu on every catalogue page.** It lists the categories available in the shopper's language, A–Z, and highlights the current one. The mobile navigation drawer shows the same list. (SWHR-T-0060)
- **Category page.** It lists the category's products A–Z, each with its description and a link to its items. (SWHR-T-0060)
- **Product page.** It lists the product's items. Each row shows the item name linked to its detail page, the description, the list price and Add to Cart. (SWHR-T-0060)
- **Item detail page** (`/item/<id>`). It shows the title, the picture, the description, List Price, Your Price and Add to Cart. (SWHR-T-0060)
- **Search.** The header search finds items whose product name, category or description contains any of the words typed. Search ignores case and counts a repeated word once. Results open with "Items matching any of: …" and show the unit cost per row. An empty search, or one with no matches, shows "No results were found for your search." (SWHR-T-0058, SWHR-T-0060)
- **Paging.** Category, product and search listings show 2 results at a time. Previous appears only when there is an earlier page, and Next only when there is a later one. (SWHR-T-0058, SWHR-T-0060)
- **Language-scoped content.** Shoppers see only the categories, products and items that exist in their language, with that language's names, descriptions and prices. Prices are not converted between currencies. (SWHR-T-0058)
- **Catalogue API**, all anonymous and read-only. Paged listings take `?start=` and `?count=`. (SWHR-T-0059)
  - `GET /api/catalog/categories`
  - `GET /api/catalog/categories/:categoryId`
  - `GET /api/catalog/items/:itemId`
  - `GET /api/catalog/search?keywords=`

## Changed

- `GET /api/catalog/products/:productId` is now paged, and its response gains `paging`. Its items carry the correct category id, which the legacy system swapped. (SWHR-T-0058, SWHR-T-0059)
- The home page's category card grid and the static category row in the header navigation are replaced by the picture map and the live Pets menu. (SWHR-T-0060)
- The search page shows real results instead of a placeholder. (SWHR-T-0060)
- If the catalogue store is unavailable, catalogue requests fail with HTTP 503 `CATALOG_ERROR` and never return a partial listing. (SWHR-T-0059)

## Upgrade notes

- New migration `drizzle/0005_mean_mach_iv.sql` adds five optional item attributes and length checks on catalogue identifiers, names and descriptions. SQLite rebuilds the affected tables. The migration applies automatically at startup. (SWHR-T-0057)
- **Foreign keys are now enforced** on every database connection. A write that references a missing parent row fails where it used to succeed silently. Deployments whose data has orphaned rows should check them before upgrading. (SWHR-T-0057)
- **The placeholder catalogue ids are replaced.** `BULLDOG`, `POODLE` and `DALMATIAN` are now the legacy ids (`K9-BD-01`, `K9-PO-02`, `K9-DL-01`, …). The seed runs only into an empty store, so an existing database keeps its old catalogue rows until those rows are cleared. (SWHR-T-0061)

## Not included

- An operator-triggered forced catalogue reload. Whether one is needed is open in SWHR-T-0063.
- Some copy that the mockups show but the release does not:
  - localized category names in product and item breadcrumbs, which show the category id
  - the catalogue-specific "could not be reached" message, where the page shows the generic error with a retry
  - the "Showing 1–2" paging summary

  These are tracked in SWHR-T-0068.

- Catalogue administration (creating or editing categories, products or items). This is a standing product non-goal.

## Known issues

- SWHR-T-0050 — `bun run dev` returns 500 on any route that reads the database. The defect is pre-existing and does not affect the built server, tests or CI.
- Search matches the English category identifier, so Japanese and Chinese shoppers cannot find a category by its localized name. This behaviour was decided (Q1).
- The product listing shows the list price, while search and the cart show the unit cost. This keeps the legacy behaviour (Q7).

## Verification

Verified at integration QA: 45/45 scenarios, 617 unit and integration tests, and 49/49 E2E tests pass. See [qa-test-report.md](qa-test-report.md) (PASS).

## Compliance / Control Evidence

| Control                      | Evidence                   | Location                                         | Status    | Exception |
| ---------------------------- | -------------------------- | ------------------------------------------------ | --------- | --------- |
| Release contents recorded    | this file                  | `artifacts/SWHR-S-0005/release-notes.md`         | Satisfied | —         |
| Release verified before land | QA PASS verdict            | `artifacts/SWHR-S-0005/qa-test-report.md`        | Satisfied | —         |
| Known limitations disclosed  | Not included, Known issues | this file; SWHR-T-0050, SWHR-T-0063, SWHR-T-0068 | Satisfied | —         |
