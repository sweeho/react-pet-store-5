---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0015
idea: SWHR-I-0012
branch: vortex/sprint/swhr-s-0015-781fce36
upstream: [artifacts/SWHR-S-0015/SPRINT-PLAN.md]
downstream:
  [
    artifacts/SWHR-S-0015/integration-test-result.md,
    artifacts/SWHR-S-0015/integration-defects-resolution.md,
  ]
---

# QA test report — SWHR-S-0015

## Executive Summary

**Verdict: PASS.** All 23 scenarios of change `swhr-i-0012-supplier-inventory` hold on the integrated sprint branch. Each maps to an approved test case (SWHR-C-0390 to SWHR-C-0412) whose citing test passes. `bun run verify` (lint, typecheck, 1004 unit tests) and `bun run test:e2e` (74 Playwright tests) exit 0 with no skips. `bun run build` exits 0. No defects found.

SCENARIO-VERDICT: Supplier stock record / Stock record created for an item — pass
SCENARIO-VERDICT: Supplier stock record / Duplicate item identifier refused — pass
SCENARIO-VERDICT: Supplier stock record / Missing quantity refused — pass
SCENARIO-VERDICT: Stock update applies only to selected rows / Selected row with a new quantity is replaced — pass
SCENARIO-VERDICT: Stock update applies only to selected rows / Unselected row with a new quantity is unchanged — pass
SCENARIO-VERDICT: Stock update applies only to selected rows / Selected row with a blank quantity is unchanged — pass
SCENARIO-VERDICT: Stock update applies only to selected rows / Zero is accepted — pass
SCENARIO-VERDICT: Negative stock quantity is ignored per row / Negative value skipped, rest of batch applied — pass
SCENARIO-VERDICT: Stock update re-attempts pending supplier orders / Back-ordered order ships after restock — pass
SCENARIO-VERDICT: Stock update re-attempts pending supplier orders / Restock insufficient for pending order — pass
SCENARIO-VERDICT: Stock update re-attempts pending supplier orders / Failure inside the unit of work — pass
SCENARIO-VERDICT: Initial stock load / Load into empty inventory — pass
SCENARIO-VERDICT: Initial stock load / Load skipped when inventory exists — pass
SCENARIO-VERDICT: Initial stock load / Forced load replaces seeded items — pass
SCENARIO-VERDICT: Supplier home screen / Entry point shows the home screen — pass
SCENARIO-VERDICT: Supplier home screen / Display Inventory action — pass
SCENARIO-VERDICT: Supplier home screen / Logout action — pass
SCENARIO-VERDICT: Inventory update screen / Every stock record is listed — pass
SCENARIO-VERDICT: Inventory update screen / Submit sends only ticked rows' changes — pass
SCENARIO-VERDICT: Inventory unavailable state / Empty inventory — pass
SCENARIO-VERDICT: Inventory unavailable state / Stock list cannot be retrieved — pass
SCENARIO-VERDICT: Inventory update confirmation screen / Confirmation after update — pass
SCENARIO-VERDICT: Inventory update confirmation screen / View inventory from confirmation — pass

Scenario-to-test mapping (derived from `openspec/changes/swhr-i-0012-supplier-inventory/test-cases.md` and the case ids cited in test titles):

| Scenario                                                                                     | Case        | Verdict |
| -------------------------------------------------------------------------------------------- | ----------- | ------- |
| Supplier stock record / Stock record created for an item                                     | SWHR-C-0390 | pass    |
| Supplier stock record / Duplicate item identifier refused                                    | SWHR-C-0391 | pass    |
| Supplier stock record / Missing quantity refused                                             | SWHR-C-0392 | pass    |
| Stock update applies only to selected rows / Selected row with a new quantity is replaced    | SWHR-C-0393 | pass    |
| Stock update applies only to selected rows / Unselected row with a new quantity is unchanged | SWHR-C-0394 | pass    |
| Stock update applies only to selected rows / Selected row with a blank quantity is unchanged | SWHR-C-0395 | pass    |
| Stock update applies only to selected rows / Zero is accepted                                | SWHR-C-0396 | pass    |
| Negative stock quantity is ignored per row / Negative value skipped, rest of batch applied   | SWHR-C-0397 | pass    |
| Stock update re-attempts pending supplier orders / Back-ordered order ships after restock    | SWHR-C-0398 | pass    |
| Stock update re-attempts pending supplier orders / Restock insufficient for pending order    | SWHR-C-0399 | pass    |
| Stock update re-attempts pending supplier orders / Failure inside the unit of work           | SWHR-C-0400 | pass    |
| Initial stock load / Load into empty inventory                                               | SWHR-C-0401 | pass    |
| Initial stock load / Load skipped when inventory exists                                      | SWHR-C-0402 | pass    |
| Initial stock load / Forced load replaces seeded items                                       | SWHR-C-0403 | pass    |
| Supplier home screen / Entry point shows the home screen                                     | SWHR-C-0404 | pass    |
| Supplier home screen / Display Inventory action                                              | SWHR-C-0405 | pass    |
| Supplier home screen / Logout action                                                         | SWHR-C-0406 | pass    |
| Inventory update screen / Every stock record is listed                                       | SWHR-C-0407 | pass    |
| Inventory update screen / Submit sends only ticked rows' changes                             | SWHR-C-0408 | pass    |
| Inventory unavailable state / Empty inventory                                                | SWHR-C-0409 | pass    |
| Inventory unavailable state / Stock list cannot be retrieved                                 | SWHR-C-0410 | pass    |
| Inventory update confirmation screen / Confirmation after update                             | SWHR-C-0411 | pass    |
| Inventory update confirmation screen / View inventory from confirmation                      | SWHR-C-0412 | pass    |

Design fidelity (advisory): the four screens were built from the mockups under `artifacts/SWHR-S-0015/design/` with the documented SD-7 copy corrections. No pixel-level comparison was run; not assessed beyond the scenario checks above.

## E2E Test Status

`bun run test:e2e` ran 74 tests in 16 files: 74 passed, 0 failed, 0 skipped (36.0s). The four supplier journeys in `e2e/supplier-inventory.spec.ts` (SWHR-C-0405, 0406, 0408, 0412) passed. Details: `artifacts/SWHR-S-0015/integration-test-result.md`.

## Unit Test Results

Command: `bun run verify` (lint + `tsc --build` + `bun --bun vitest run`), exit 0.

```
 Test Files  194 passed (194)
      Tests  1004 passed (1004)
```

## Code Review

Not a line-by-line review of merged tickets. By inspection of the sprint's summaries: stock update, re-fulfilment and invoicing run as one unit of work (rollback covered by SWHR-C-0400); UI pages share a session gate in `src/components/supplier/`. No issues noted.

## Coverage Summary

No coverage command is declared for this project and none was run. Coverage is reported as scenario coverage only: 23 of 23 scenarios have a passing citing test.

## Issues Found

None. No defects, no SPEC-GAP findings.

## Recommendation

Approve. All acceptance criteria are verified by executed runs quoted above.
