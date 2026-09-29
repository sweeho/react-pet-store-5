---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0005
idea: SWHR-I-0006
branch: vortex/sprint/swhr-s-0005-5fbe3df1
upstream:
  [
    artifacts/SWHR-S-0005/SPRINT-PLAN.md,
    artifacts/SWHR-S-0005/qa-test-report.md,
    artifacts/SWHR-S-0005/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0005/release-notes.md]
---

# Sprint summary — SWHR-S-0005

## Tickets

| Ticket      | Type  | Title                                                                                     | Outcome                                        |
| ----------- | ----- | ----------------------------------------------------------------------------------------- | ---------------------------------------------- |
| SWHR-T-0054 | TASK  | Sprint plan — SWHR-S-0005                                                                 | DONE (commit 9ccb280)                          |
| SWHR-T-0055 | EPIC  | Catalog browsing and search                                                               | DONE (rollup)                                  |
| SWHR-T-0056 | STORY | Shopper browses and searches the locale-aware pet catalogue                               | DONE (rollup)                                  |
| SWHR-T-0057 | TASK  | Catalog data model: attributes, length checks and enforced foreign keys                   | DONE (#37) — [summary](SWHR-T-0057/summary.md) |
| SWHR-T-0061 | TASK  | Catalog seed data and listing-cache decision                                              | DONE (#38) — [summary](SWHR-T-0061/summary.md) |
| SWHR-T-0058 | TASK  | Catalog queries: locale-scoped listings, lookups, paging and keyword search               | DONE (#39) — [summary](SWHR-T-0058/summary.md) |
| SWHR-T-0059 | TASK  | Catalog server routes: categories, products, items and search                             | DONE (#40) — [summary](SWHR-T-0059/summary.md) |
| SWHR-T-0060 | TASK  | Storefront catalog screens: home map, Pets menu, category, product, item and search pages | DONE (#41) — [summary](SWHR-T-0060/summary.md) |
| SWHR-T-0062 | TASK  | Pin the settled open decisions (Q1, Q3, Q4, Q7, Q8) with regression tests                 | DONE (#42) — [summary](SWHR-T-0062/summary.md) |
| SWHR-T-0066 | TASK  | Integration QA report — SWHR-S-0005                                                       | DONE (#43), verdict PASS                       |
| SWHR-T-0067 | TASK  | Sprint close bundle — SWHR-S-0005                                                         | this file                                      |

## What shipped

Sprint goal "SWHR-I-0006: Catalog browsing and search" is met. Any visitor, signed in or not, can now browse and search the pet catalogue in their language:

- **Catalogue data.** Categories, products and items each have per-locale `*_details` rows. Prices are integer minor units. Items gained five optional attributes and length checks, and `db/client.ts` now turns on `PRAGMA foreign_keys`, so every `references()` is enforced (migration `drizzle/0005_mean_mach_iv.sql`). (SWHR-T-0057)
- **Seed.** `db/seed/catalog.ts` loads the legacy pet catalogue on first start into an empty store: 5 categories, 16 products (`K9-BD-01` … `AV-SB-02`) and 28 items (`EST-1` … `EST-28`) in en_US, ja_JP and zh_CN, with the specified locale gaps (EST-15 has no ja_JP). There is no listing cache, so the cache scenarios hold trivially. (SWHR-T-0061)
- **Queries.** `lib/catalog/queries.ts` adds `listCategories`, `getCategory`, `listProducts`, `listItems`, `parseKeywords` and `searchItems`. `lib/catalog/paging.ts` adds the shared `{ items, paging }` shape with a default page size of 2. Store failures surface as `CatalogError`. Item lookups return the correct category id; the legacy DAO had it swapped (D4). (SWHR-T-0058)
- **API.** Anonymous JSON routes under `routes/api/catalog/`: categories, one category's products, one product's items (now paged), one item, and search. A store failure returns 503 `CATALOG_ERROR` with no partial body. (SWHR-T-0059)
- **Screens.** The home page has the "Choose a pet to start" picture map. A live Pets panel appears on every catalogue page, and the mobile drawer uses the same list. New or rebuilt category, product, item-detail and search-result pages have Previous/Next paging and Add to Cart. (SWHR-T-0060)
- **Settled decisions pinned.** `lib/catalog/decisions.test.ts` pins Q1, Q3, Q4, Q7 and Q8 as regression tests. (SWHR-T-0062)

## Divergence from plan

- **The Pets panel is composed on each page instead of in `SiteLayout`** (SWHR-T-0060). `SiteLayout` also wraps admin, supplier, cart and checkout, so adding the panel there would need route logic. The panel also appears on item detail, where the mockup omits it, because SWHR-R-0104 requires it on every storefront page.
- **UI copy differs from the mockups in three places** (SWHR-T-0060):
  - Product and item breadcrumbs show the raw category id, not its localized name.
  - The catalogue-unavailable state shows the generic `AsyncContent` error and retry, not the mockup's "The pet catalog could not be reached" copy.
  - The "Showing 1–2" paging summary is omitted.

  No acceptance criterion covers any of these. They are raised as SWHR-T-0068.

- **Most seed item details were authored, not copied** (SWHR-T-0061). The legacy populate XML is not in the repository. The fixed points that PLAN.md and the mockups name are exact (EST-6 "Male Adult Bulldog" at $18.50 list and $12.00 unit cost; DOGS page 1 is Bulldog, then Chihuahua). The other 26 items' attributes, prices and translations were written by hand.
- **Error mapping lives in `lib/catalog/request.ts`** (SWHR-T-0059), alongside the locale and paging helpers, so it is not repeated in each route. `listProductItems` is now unused by routes but was kept, because its owner's tests still call it.
- **`e2e/sign-on.spec.ts` and `e2e/home.spec.ts` were edited outside SWHR-T-0060's ownership map.** Both asserted placeholder text that the real pages replaced.
- Otherwise the sprint was delivered to plan. No ticket was added, split or dropped.

## Verification

PASS. Lint and typecheck are clean. 617 unit and integration tests pass across 127 files, 149 of them catalogue-specific. The build passes. All 49 Playwright tests pass: 13 in `catalog-browsing.spec.ts` and 1 in `catalog-anonymous-access.spec.ts`. All 45 scenarios across the 24 requirements of change `swhr-i-0006-catalog-browsing-and-search` pass, with no spec gaps. Integration found no defects. See [qa-test-report.md](qa-test-report.md), [integration-test-result.md](integration-test-result.md) and [integration-defects-resolution.md](integration-defects-resolution.md).

## Root docs

No root doc changed at close. The planning commit (9ccb280) already added the ARCHITECTURE.md Key Decisions (catalogue-driven Pets menu, enforced foreign keys, one paging shape) and the DESIGN.md Pets panel. The delivered code matches both. PRODUCT.md already listed catalog-browsing in its capability map. AGENTS.md is human-authored and was not touched. One stale path predates this sprint and was left as is: ARCHITECTURE.md §Data flow example names `routes/api/catalog/products/[productId].ts`, but the file has been `[productId].get.ts` since SWHR-S-0002.

## Defects Raised

No product defects were raised this sprint. Implementation filed two platform-tooling defects: `a2a_run_tests` green runs flag stub-sentinel text in historical artifacts as live stubs.

- SWHR-T-0064 (REFINED)
- SWHR-T-0065 (REFINED)

This made every green verdict in the sprint read `invalid` even though every case passed.

## Known Issues

- **SWHR-T-0050** (REFINED, P2) — `bun run dev` returns 500 on any route that reaches `db/client.ts`. The defect is pre-existing and carried over from SWHR-S-0004. The built server, tests and CI are unaffected.

## Open decisions

- **SWHR-T-0063** (BACKLOG) — design Q6 asks whether an operator-only forced catalogue reload is needed. None was built, and the seed runs only into an empty store.
- **Q1 is settled but may surprise non-English shoppers.** Search matches the English category identifier, so a ja_JP or zh_CN shopper cannot find a category by its localized name. SWHR-T-0062 pins this behaviour.
- **Q7 is settled as the observed legacy behaviour.** The product listing shows the list price, while search and the cart show the unit cost. A shopper can see one price and be charged another.

## Retrospective

- **Went well:** the plan split the work into strict layers, each with fixed contracts in design.md: schema → seed → queries → routes → screens → pinned decisions. Six tickets merged in sequence with no contract change and no plan revision. QA's code review found D1–D8 and every settled Q implemented as written.
- **Went well:** CI's E2E tier caught three real regressions that no implementation container could see:
  - Home was missing the Pets panel.
  - Two items shared a price, which made a Playwright locator ambiguous.
  - A stale search heading was still asserted.

  All three were fixed before merge, and integration QA passed on its first run.

- **Could improve:** for the fifth sprint running, implementation containers could not run Playwright. The pinned `@playwright/test@~1.50` expects `chromium-1155`, and the image ships `chromium-1223`. QA got E2E running with a local symlink between the two revisions. Aligning the pin with the image, or documenting the symlink, would let implementers run E2E locally.
- **Could improve:** the `a2a_run_tests` sentinel scanner (SWHR-T-0064/0065) made every green run in the sprint report `invalid`. Two tickets also had to dispute test cases whose behaviour predated them (SWHR-C-0149/0150/0153/0154/0162). Test cases for behaviour that already exists should be marked as regression pins when they are authored, so they do not demand a red run.
- **Could improve:** the plan did not account for mockup copy that needs a component outside a ticket's map, such as `AsyncContent`'s error text. When a mockup shows state-specific copy, planning should list the shared component that renders it.

## Compliance / Control Evidence

| Control                        | Evidence                                                    | Location                                                                                                                    | Status    | Exception                                                                        |
| ------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------- |
| Work planned before execution  | Change proposal, design, specs, tasks; per-ticket PLAN.md   | `openspec/changes/swhr-i-0006-catalog-browsing-and-search/` (archived at close), `artifacts/SWHR-S-0005/SWHR-T-00*/PLAN.md` | Satisfied | —                                                                                |
| Tests executed per ticket      | TDD results                                                 | `artifacts/SWHR-S-0005/SWHR-T-00{57..62}/tdd-test-result.md`                                                                | Satisfied | Green verdicts `invalid` from tool defect SWHR-T-0065; E2E ran in CI and QA only |
| Change verified before release | QA report, PASS, 45/45 scenarios                            | `artifacts/SWHR-S-0005/qa-test-report.md`                                                                                   | Satisfied | —                                                                                |
| Defects dispositioned          | 0 integration defects; pre-existing SWHR-T-0050 carried     | `artifacts/SWHR-S-0005/integration-defects-resolution.md`, SWHR-T-0050                                                      | Satisfied | SWHR-T-0050 open                                                                 |
| Open decisions tracked         | Forced-reload decision ticket                               | SWHR-T-0063                                                                                                                 | Satisfied | Ruling pending                                                                   |
| Release approval               | Sprint reached SPRINT_CLOSE via `validation.all_acs_passed` | SWHR-T-0066                                                                                                                 | Satisfied | Human approver: Not Provided                                                     |
