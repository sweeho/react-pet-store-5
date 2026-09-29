---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0005
idea: SWHR-I-0006
branch: vortex/sprint/swhr-s-0005-5fbe3df1
upstream:
  [
    artifacts/SWHR-S-0005/SPRINT-PLAN.md,
    artifacts/SWHR-S-0005/integration-test-result.md,
    artifacts/SWHR-S-0005/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0005/sprint-summary.md]
---

# QA test report — SWHR-S-0005

## Executive Summary

**Verdict: PASS.** SWHR-I-0006 (catalog browsing and search) holds on the integrated sprint branch.
All 24 spec requirements / 45 scenarios in
`openspec/changes/swhr-i-0006-catalog-browsing-and-search/specs/catalog-browsing/spec.md` verify
`pass`; none are `not-testable` and none are spec gaps. Lint, typecheck, the full unit/integration
suite (617 tests), the production build, and the full Playwright E2E suite (49 tests, including the
13 catalog-browsing scenarios) all pass on first run. No defects were found — see
`integration-defects-resolution.md` (empty, `COMPLETE`).

## E2E Test Status

49 Playwright tests across 9 spec files pass, 0 failed, 0 skipped, run against the integrated,
built sprint branch (`bunx playwright test --project=chromium`). Full command, per-spec table and
environment note (a browser-revision mismatch worked around with a local symlink, no download) are
in `artifacts/SWHR-S-0005/integration-test-result.md`; see `E2E-RESULT: chromium 49 passed, 0
failed, 0 skipped` there.

## Unit Test Results

```
$ bun run verify
$ bun run lint && bun run typecheck && bun run test
...
 Test Files  127 passed (127)
      Tests  617 passed (617)
   Start at  05:43:33
   Duration  14.69s
```

Lint and `tsc --build` also passed with zero warnings/errors (`verify` runs them before `test` and
would have failed the whole command otherwise).

Catalog-specific subset (`lib/catalog/**`, `routes/api/catalog/**`, the catalog/search pages and
components):

```
$ NODE_ENV=test bun --bun vitest run lib/catalog routes/api/catalog src/pages/category \
    src/pages/product src/pages/item src/pages/search.test.tsx src/components/catalog \
    src/hooks/useCatalogCategories
...
 Test Files  20 passed (20)
      Tests  149 passed (149)
```

## Code Review

Read `lib/catalog/queries.ts`, `paging.ts`, `errors.ts`, `request.ts`, the five catalog routes, the
seed (`db/seed/catalog.ts`), and the five catalog pages plus `PetsMenu`/`Home` against
`design.md`'s decisions (D1–D8, Q1–Q10) and the delta spec. No notable concerns: money is stored as
integer minor units with locale-scoped `item_details`/`product_details` rows (D1/D2); search is
case-insensitive and matches on the category identifier, not its localized name, as decided for Q1;
`listItems`/`getItem`/`searchItems` all resolve the category id via a join on `product`, avoiding the
legacy swapped-identifier bug (D4); paging fetches `count + 1` rows and floors `previousStart` at
zero per Q3/P1; `PRAGMA foreign_keys = ON` is set in `db/client.ts` (SD3); the seed uses the legacy
catalog ids (`K9-BD-01`, `EST-6`, `EST-15`, "Dalmation", …) per SD1; every catalog route wraps store
failures as `CatalogError` → HTTP 503 `CATALOG_ERROR` with no partial body (P2/SWHR-R-0098); no route
under `routes/api/catalog/**` is gated by sign-on (SWHR-R-0097).

**Scenario verdicts** — every `#### Scenario:` under `specs/catalog-browsing/spec.md`, exercised via
the unit/integration/UI tests cited and, where noted, the E2E run in
`integration-test-result.md`:

```
SCENARIO-VERDICT: Catalog category records / Category details stored for two locales — pass
SCENARIO-VERDICT: Catalog category records / Category details without a name are rejected — pass
SCENARIO-VERDICT: Catalog category records / Duplicate details for the same locale are rejected — pass
SCENARIO-VERDICT: Catalog product records / Product belongs to one category — pass
SCENARIO-VERDICT: Catalog product records / Product referencing a missing category is rejected — pass
SCENARIO-VERDICT: Catalog item records / Item prices are held to two decimal places — pass
SCENARIO-VERDICT: Catalog item records / Item details without a price are rejected — pass
SCENARIO-VERDICT: Locale-scoped catalog visibility / Item without details in the shopper's locale is hidden — pass
SCENARIO-VERDICT: Locale-scoped catalog visibility / Category without details in the locale is omitted from the category list — pass
SCENARIO-VERDICT: Category listing / Categories listed alphabetically — pass
SCENARIO-VERDICT: Product listing for a category / Products of a category listed alphabetically — pass
SCENARIO-VERDICT: Product listing for a category / Unknown category yields an empty listing — pass
SCENARIO-VERDICT: Item listing for a product / Items of a product carry their own identifiers — pass
SCENARIO-VERDICT: Single catalog entry lookup / Item found — pass
SCENARIO-VERDICT: Single catalog entry lookup / Item missing in the requested locale — pass
SCENARIO-VERDICT: Search keyword parsing / Duplicate keywords collapse — pass
SCENARIO-VERDICT: Search keyword parsing / Blank query — pass
SCENARIO-VERDICT: Search keyword matching / Any keyword matches — pass
SCENARIO-VERDICT: Search keyword matching / Case-insensitive match — pass
SCENARIO-VERDICT: Search keyword matching / Category identifier matches — pass
SCENARIO-VERDICT: Paged catalog listings / Middle page — pass
SCENARIO-VERDICT: Paged catalog listings / Last page — pass
SCENARIO-VERDICT: Paged catalog listings / Start beyond the last result — pass
SCENARIO-VERDICT: Previous-page navigation / Previous from a full page — pass
SCENARIO-VERDICT: Previous-page navigation / First page has no previous page — pass
SCENARIO-VERDICT: Default storefront page size / Fresh listing — pass
SCENARIO-VERDICT: Anonymous catalog access / Visitor who is not signed on browses — pass
SCENARIO-VERDICT: Read-only catalog operations and failure behaviour / Catalog store unavailable — pass
SCENARIO-VERDICT: Cached catalog listings / Cached listing expires — pass
SCENARIO-VERDICT: Cached catalog listings / Cache does not cross categories — pass
SCENARIO-VERDICT: Catalog seed data / First entry into an empty store — pass
SCENARIO-VERDICT: Catalog seed data / Entry into an already populated store — pass
SCENARIO-VERDICT: Catalog browsing navigation / Browse to a bulldog — pass
SCENARIO-VERDICT: Storefront home category map / Selecting a region — pass
SCENARIO-VERDICT: Storefront home category map / All five categories are reachable — pass
SCENARIO-VERDICT: Item detail page / Item detail displayed — pass
SCENARIO-VERDICT: Item detail page / Add to Cart from the item detail page — pass
SCENARIO-VERDICT: Category navigation menu / Menu on every page — pass
SCENARIO-VERDICT: Category product listing page / Category page with more products than one page — pass
SCENARIO-VERDICT: Category product listing page / Selecting a product — pass
SCENARIO-VERDICT: Product item listing page / Product page displayed — pass
SCENARIO-VERDICT: Product item listing page / Add to Cart from the product page — pass
SCENARIO-VERDICT: Search results page / Matching items displayed — pass
SCENARIO-VERDICT: Search results page / Nothing matches — pass
SCENARIO-VERDICT: Search results page / Empty keyword field — pass
```

45/45 scenarios pass. No `not-testable`, no `SPEC-GAP`.

**Design fidelity (advisory).** Reference: `artifacts/SWHR-S-0005/design/mockup-home-pet-picture-map.html`
(mockup, 1440×900) and the seven other mockups indexed in `artifacts/SWHR-S-0005/design/MANIFEST.md`.
Method: read each mockup's structure/copy and compared against the built pages
(`src/pages/index.tsx`, `category/[categoryId].tsx`, `product/[productId].tsx`, `item/[itemId].tsx`,
`search.tsx`) and their i18n strings. The home page matches the mockup's structure and copy exactly
(heading "Choose a pet to start", one region per category, Pets side panel); the category, product,
item and search pages match their mockups' element sets (breadcrumb, paging links, price labels,
Add to Cart) per the PLAN.md build steps and the passing UI tests cited above. No material
deviations observed. This did not affect the verdict.

## Coverage Summary

No coverage tool is declared for this project (`AGENTS.md`'s command table lists no `check-coverage`
/ `test-coverage` gate, and no `coverage` script exists in `package.json`). Evidence is therefore the
executed test counts above, not a coverage percentage: 617 unit/integration tests across 127 files
(127/127 files green), of which 149 tests across 20 files exercise `lib/catalog/**`,
`routes/api/catalog/**` and the catalog/search UI directly, plus 49 E2E tests including 14 catalog
E2E scenarios (`catalog-browsing.spec.ts` + `catalog-anonymous-access.spec.ts`). Every one of the 24
spec requirements has at least one unit, integration, UI or E2E test naming it (see `## Code Review`
scenario verdicts above).

## Issues Found

None. `integration-defects-resolution.md` is filed with an empty summary table and
`INTEGRATION_DEFECTS_RESOLUTION: COMPLETE`.

## Recommendation

**Proceed — fire `validation.all_acs_passed`.** Every acceptance criterion on SWHR-T-0066 and every
scenario in the sprint's delta spec verified pass with real, executed evidence; no defects were
found or fixed in place; nothing was escalated.
