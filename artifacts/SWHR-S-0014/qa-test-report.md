---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0014
idea: SWHR-I-0011
branch: vortex/sprint/swhr-s-0014-c83c7c4f
upstream: [artifacts/SWHR-S-0014/SPRINT-PLAN.md]
downstream:
  [
    artifacts/SWHR-S-0014/integration-test-result.md,
    artifacts/SWHR-S-0014/integration-defects-resolution.md,
  ]
---

# QA test report — SWHR-S-0014

## Executive Summary

**Verdict: PASS.** All 50 scenarios of change `swhr-i-0011-order-fulfillment` hold on the integrated sprint branch, and all 49 approved test cases (SWHR-C-0340 to SWHR-C-0389) have a citing test that passes. `bun run verify` (lint, typecheck, 963 unit tests) and `bun run test:e2e` (70 Playwright tests) both exit 0 with no skips. No defects found.

The change has no screen of its own (order status shows in the existing administrator order lists), so there is no design reference to compare; the only UI-facing scenario is the checkout-to-COMPLETED journey, covered by `e2e/order-fulfillment.spec.ts`.

The scenario-to-test mapping was derived by matching each approved case id in `openspec/changes/swhr-i-0011-order-fulfillment/test-cases.md` to the test files that cite it. Four cases (C-0372, C-0374, C-0377, C-0378) are cited only in `plugins/supplier-intake.test.ts`, which was run on its own (5 passed).

SCENARIO-VERDICT: Order capture is separated from order processing and supplier fulfilment / A placed order flows to the supplier and is invoiced back — pass
SCENARIO-VERDICT: Purchase order record / Order stored under its incoming identifier — pass
SCENARIO-VERDICT: Purchase order record / Duplicate order identifier rejected — pass
SCENARIO-VERDICT: Purchase order creation is atomic / Lines start unshipped — pass
SCENARIO-VERDICT: Purchase order creation is atomic / Dependent record failure rolls back the order — pass
SCENARIO-VERDICT: Single stored contact serves as billing and shipping contact / Billing contact differs from shipping contact on intake — pass
SCENARIO-VERDICT: Purchase order deletion removes its dependents / Deleting an order — pass
SCENARIO-VERDICT: Purchase order snapshot / Snapshot read after the loading transaction ends — pass
SCENARIO-VERDICT: Line item attributes and immutability / Catalog price change does not alter a stored line — pass
SCENARIO-VERDICT: Line item attributes and immutability / Attempt to change a fixed attribute — pass
SCENARIO-VERDICT: Line item creation requires an initial shipped quantity / Line copied with a stated shipped quantity — pass
SCENARIO-VERDICT: Order workflow status record / One status per order — pass
SCENARIO-VERDICT: Order workflow lifecycle / Approval — pass
SCENARIO-VERDICT: Order workflow lifecycle / Denial — pass
SCENARIO-VERDICT: Order workflow lifecycle / Partial then complete shipment — pass
SCENARIO-VERDICT: Starting order workflow tracking / Tracking started for a new order — pass
SCENARIO-VERDICT: Starting order workflow tracking / Tracking started twice — pass
SCENARIO-VERDICT: Reading and updating order workflow status / Status update of an existing order — pass
SCENARIO-VERDICT: Reading and updating order workflow status / Status update of an unknown order — pass
SCENARIO-VERDICT: Reading and updating order workflow status / Status read of an unknown order — pass
SCENARIO-VERDICT: Listing orders by workflow status / Orders listed by status — pass
SCENARIO-VERDICT: Workflow tracking operations are transactional / Status change rolled back with its triggering step — pass
SCENARIO-VERDICT: Order intake at the order processing centre / New order received — pass
SCENARIO-VERDICT: Supplier purchase order generation on approval / Approved order produces one supplier purchase order — pass
SCENARIO-VERDICT: Supplier purchase order generation on approval / Denied order produces no supplier purchase order — pass
SCENARIO-VERDICT: Batched customer status notification after an approval batch / Mixed approval batch — pass
SCENARIO-VERDICT: Recording supplier shipments against an order / Invoice applied to matching lines — pass
SCENARIO-VERDICT: Recording supplier shipments against an order / Invoice for an item not on the order — pass
SCENARIO-VERDICT: Order completion evaluation on invoice receipt / Final invoice completes the order — pass
SCENARIO-VERDICT: Order completion evaluation on invoice receipt / Partial invoice — pass
SCENARIO-VERDICT: Order completion evaluation on invoice receipt / Over-shipment is not completion — pass
SCENARIO-VERDICT: Order processing steps are atomic and retried / Failure while sending after a status change — pass
SCENARIO-VERDICT: Order processing steps are atomic and retried / Unparseable supplier purchase order — pass
SCENARIO-VERDICT: Supplier purchase order record / Supplier orders listed by status — pass
SCENARIO-VERDICT: Supplier purchase order creation / Supplier order created as pending — pass
SCENARIO-VERDICT: Supplier purchase order statuses / Fulfilled supplier order — pass
SCENARIO-VERDICT: Supplier purchase order deletion removes its dependents / Deleting a supplier order — pass
SCENARIO-VERDICT: Supplier handling of a received purchase order / Nothing in stock on receipt — pass
SCENARIO-VERDICT: Supplier handling of a received purchase order / Stock available on receipt — pass
SCENARIO-VERDICT: Whole-line shipment from stock / Insufficient stock for a line — pass
SCENARIO-VERDICT: Whole-line shipment from stock / Sufficient stock for a line — pass
SCENARIO-VERDICT: Whole-line shipment from stock / Item with no stock record — pass
SCENARIO-VERDICT: Partial shipment across lines and supplier order completion / One of two lines can ship — pass
SCENARIO-VERDICT: Partial shipment across lines and supplier order completion / Re-attempt ships the remaining line — pass
SCENARIO-VERDICT: Supplier invoice content / Invoice lists only this attempt's lines — pass
SCENARIO-VERDICT: Re-fulfilment of pending supplier orders on stock update / Stock update releases a waiting order — pass
SCENARIO-VERDICT: Re-fulfilment of pending supplier orders on stock update / One pending order fails invoice building — pass
SCENARIO-VERDICT: Supplier message channels / Invoice published after stock update — pass
SCENARIO-VERDICT: Workflow step failures preserve their root cause / Handler fails — pass
SCENARIO-VERDICT: Configured dependencies fail fast / Missing configured channel — pass

## E2E Test Status

`bun run test:e2e`: 70 passed, 0 failed, 0 skipped. The order fulfilment journey `[SWHR-C-0340]` (checkout, supplier order, invoice, COMPLETED) passed. Full per-spec table and command in `artifacts/SWHR-S-0014/integration-test-result.md`.

## Unit Test Results

```
$ bun run verify
eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   (no findings)
tsc --build                                                                 (no errors)
 Test Files  188 passed (188)
      Tests  963 passed (963)
```

Exit code 0. `bun run build` also exited 0.

## Code Review

No notable concerns observed. Incidental note: `lib/b2b/scenarios/coverage.test.ts` still checks only `swhr-i-0004`, so nothing self-checks that this change's approved cases stay cited; the mapping above was checked by a one-off script, not a committed test. Not filed as a defect.

## Coverage Summary

No coverage tool is declared in the project commands and none was run; no coverage percentage is claimed. Case-level traceability (every approved case cited by a passing test) is the only coverage measured, as described in the Executive Summary.

## Issues Found

None. See `artifacts/SWHR-S-0014/integration-defects-resolution.md`. No SPEC-GAP found.

## Recommendation

Proceed: fire `validation.all_acs_passed`.
