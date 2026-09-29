---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0005
ticket: SWHR-T-0062
branch: vortex/feat/SWHR-T-0062-pin-the-settled-open-decisions-q1-q3-q4-c325ad7a
upstream: [artifacts/SWHR-S-0005/SWHR-T-0062/PLAN.md]
downstream: [artifacts/SWHR-S-0005/qa-test-report.md]
---

# Summary — SWHR-T-0062: Pin the settled open decisions (Q1, Q3, Q4, Q7, Q8)

## What changed

Added `lib/catalog/decisions.test.ts`, a regression suite pinning each open question design.md
records as settled for this sprint. No production code changed: every decision was already
correctly implemented by SWHR-T-0058 (`lib/catalog/queries.ts`, `paging.ts`) and SWHR-T-0061
(seed data), so no test exposed a contradiction to fix.

## Files

- `lib/catalog/decisions.test.ts` — new. One `describe` per question (Q1, Q3/Q4, Q4, Q7, Q8),
  12 tests total, each title citing its question code.

## AC coverage

- AC-1 (Q1) — `[Q1]` tests: "FISH"/"fish" return identical en_US results; a ja_JP search for the
  FISH category's ja_JP name ("魚") does not match FI-SW-01/EST-1 by category membership alone.
- AC-2 (Q3) — `[Q3]` test: an in-test 5-item fixture product, start 4/size 2, asserts
  `previousStart: 3`.
- AC-3 (Q4) — `[Q4]` tests: `DEFAULT_PAGE_SIZE === 2`; the product, category and search routes
  each cap an unparameterized listing at 2 rows; the categories route (Pets menu) returns all 5
  en_US categories, uncapped.
- AC-4 (Q7) — `[Q7]` tests: the product route's EST-6 row carries `listPrice: 1850`
  (`formatPrice` → `$18.50`); the search route's EST-6 row carries `unitCost: 1200`
  (`formatPrice` → `$12.00`).
- AC-5 (Q8) — `[Q8]` tests: two consecutive `listItems`/`searchItems` calls return identical,
  ascending-by-item-id id sequences.
- AC-6 — every question code (Q1, Q3, Q4, Q7, Q8) appears in a test title in
  `lib/catalog/decisions.test.ts` (see `tdd-test-result.md` for the full list).

## Verification

```
$ bun --bun vitest run lib/catalog/decisions.test.ts
 Test Files  1 passed (1)
      Tests  12 passed (12)

$ bun run verify     # lint + typecheck + full unit suite (see Notes re: verify:full)
 Test Files  127 passed (127)
      Tests  617 passed (617)
```

See `tdd-test-result.md` — `TDD-RESULT: 617 passed, 0 failed`, plus a temporary invert-and-revert
of Q3's arithmetic proving the new tests actually catch a regression.

## Notes

`verify:full`'s E2E preflight reported Chromium genuinely missing in this container
(`ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed"). Per AGENTS.md,
fell back to `verify` (browser-free tier) rather than installing or retrying; E2E re-runs in
INTEGRATION_QA. No `openspec/` file was touched, per this project's convention that checkbox and
spec state is stamped by the platform on merge.
