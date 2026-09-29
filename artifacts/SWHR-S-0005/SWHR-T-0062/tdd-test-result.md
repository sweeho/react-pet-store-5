---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0005
ticket: SWHR-T-0062
branch: vortex/feat/SWHR-T-0062-pin-the-settled-open-decisions-q1-q3-q4-c325ad7a
upstream: [artifacts/SWHR-S-0005/SWHR-T-0062/PLAN.md]
---

# TDD result — SWHR-T-0062

## Test cases

| Test                                                                                                                                      | Covers | Intent                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------ |
| `lib/catalog/decisions.test.ts › Q1 … › [Q1] a search for 'FISH' and for 'fish' return the same en_US items`                              | AC-1   | case-insensitive search (D3)                                 |
| `lib/catalog/decisions.test.ts › Q1 … › [Q1] a ja_JP search for the FISH category's ja_JP name ('魚') matches no item solely by category` | AC-1   | search matches the category id, not its localized name       |
| `lib/catalog/decisions.test.ts › Q3/Q4 fixture › [Q3] a last page starting at 4 … offers a previous page starting at 3`                   | AC-2   | previous-page start = current start − rows on this page (D7) |
| `lib/catalog/decisions.test.ts › Q3/Q4 fixture › [Q4] the product route … shows at most 2 of this product's 5 items`                      | AC-3   | default page size 2 applies to a product's item listing      |
| `lib/catalog/decisions.test.ts › Q4 … › [Q4] DEFAULT_PAGE_SIZE is 2`                                                                      | AC-3   | the exported default page size constant                      |
| `lib/catalog/decisions.test.ts › Q4 … › [Q4] the category route … shows at most 2 rows`                                                   | AC-3   | default page size 2 applies to a category's product listing  |
| `lib/catalog/decisions.test.ts › Q4 … › [Q4] the search route … shows at most 2 rows`                                                     | AC-3   | default page size 2 applies to search results                |
| `lib/catalog/decisions.test.ts › Q4 … › [Q4] the Pets menu (categories route) lists every category available in en_US (5), uncapped`      | AC-3   | the Pets menu carries no count cap                           |
| `lib/catalog/decisions.test.ts › Q7 … › [Q7] the product listing shows EST-6's list price, $18.50 in en_US`                               | AC-4   | product listing shows list price                             |
| `lib/catalog/decisions.test.ts › Q7 … › [Q7] the search results show EST-6's unit cost, $12.00 in en_US`                                  | AC-4   | search results show unit cost                                |
| `lib/catalog/decisions.test.ts › Q8 … › [Q8] two consecutive listItems calls … identical id sequences in ascending item-id order`         | AC-5   | deterministic item-listing order                             |
| `lib/catalog/decisions.test.ts › Q8 … › [Q8] two consecutive searchItems calls … identical id sequences in ascending item-id order`       | AC-5   | deterministic search-result order                            |

All five question codes (Q1, Q3, Q4, Q7, Q8) are cited in at least one test title above (AC-6).

## Red run

This ticket pins decisions already correctly implemented by prior tickets in this sprint
(`lib/catalog/queries.ts` and `lib/catalog/paging.ts` from SWHR-T-0058, seed data from
SWHR-T-0061) — writing `decisions.test.ts` against the unmodified implementation is the point of
a regression/characterization test, so there is no red state to drive out by writing new
production code. `bun --bun vitest run lib/catalog/decisions.test.ts` passed 12/12 on first run
with zero source changes.

To prove the tests are not vacuous, one decision (Q3's previous-page arithmetic,
`lib/catalog/paging.ts`) was temporarily inverted to the disputed alternative design.md records
(`start - count` instead of `start - items.length`) and the suite re-run:

`bun --bun vitest run lib/catalog/decisions.test.ts lib/catalog/paging.test.ts`

```
❯ |server| lib/catalog/decisions.test.ts (12 tests | 1 failed) 12ms
   × [Q3] a last page starting at 4 (1 of 5 items, page size 2) offers a previous page starting at 3

AssertionError: expected { start: 4, count: 2, …(4) } to match object { hasPrevious: true, previousStart: 3 }
- Expected
+ Received
  {
    "hasPrevious": true,
-   "previousStart": 3,
+   "previousStart": 2,
  }

 Test Files  1 failed | 1 passed (2)
      Tests  1 failed | 18 passed (19)
```

`paging.ts` was reverted immediately after (`git diff -- lib/catalog/paging.ts` is empty) — no
production code was changed for this ticket.

## Green run

`bun run verify` — this stack's browser-free full gate (lint + typecheck + the complete unit
suite). `verify:full` was attempted first; its E2E preflight reported Chromium genuinely missing
in this container (`Playwright's Chromium browser is not installed`), so per AGENTS.md this falls
back to `verify` rather than installing or retrying — E2E runs again in INTEGRATION_QA.

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  127 passed (127)
      Tests  617 passed (617)
```

TDD-RESULT: 617 passed, 0 failed
