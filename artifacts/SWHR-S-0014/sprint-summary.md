---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0014
idea: SWHR-I-0011
branch: vortex/sprint/swhr-s-0014-c83c7c4f
upstream:
  [
    artifacts/SWHR-S-0014/SPRINT-PLAN.md,
    artifacts/SWHR-S-0014/qa-test-report.md,
    artifacts/SWHR-S-0014/integration-test-result.md,
    artifacts/SWHR-S-0014/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0014/release-notes.md]
---

# Sprint summary — SWHR-S-0014

## Tickets

| Ticket      | Type  | Title                                                                                                  | Outcome                                         |
| ----------- | ----- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| SWHR-T-0131 | TASK  | Sprint plan — SWHR-S-0014                                                                              | DONE                                            |
| SWHR-T-0132 | EPIC  | Order fulfillment                                                                                      | DONE (rollup)                                   |
| SWHR-T-0133 | STORY | An approved order is shipped from supplier stock, invoiced back and completed without manual steps     | DONE (rollup)                                   |
| SWHR-T-0134 | TASK  | Data model: order workflow, shipped quantity, supplier cascades and stock table (migration 0008)       | DONE (#94) — [summary](SWHR-T-0134/summary.md)  |
| SWHR-T-0136 | TASK  | Message dispatch: workflow-step error, fail-fast channel resolution, completed-order channel           | DONE (#95) — [summary](SWHR-T-0136/summary.md)  |
| SWHR-T-0135 | TASK  | Purchase order persistence: strict create, duplicate rejection, snapshot, shipped-quantity line access | DONE (#96) — [summary](SWHR-T-0135/summary.md)  |
| SWHR-T-0137 | TASK  | Order workflow tracking: workflow module and status moved to orderWorkflow (migration 0009)            | DONE (#97) — [summary](SWHR-T-0137/summary.md)  |
| SWHR-T-0138 | TASK  | Order processing centre: invoice consumer, exact-equality completion and completed-order notice        | DONE (#98) — [summary](SWHR-T-0138/summary.md)  |
| SWHR-T-0139 | TASK  | Supplier fulfilment: whole-line shipment, invoices, re-fulfilment on stock update, stock seed          | DONE (#99) — [summary](SWHR-T-0139/summary.md)  |
| SWHR-T-0140 | TASK  | Order fulfilment test harness: integration scenario, checkout-to-invoice Playwright journey, audit     | DONE (#100) — [summary](SWHR-T-0140/summary.md) |
| SWHR-T-0141 | TASK  | Integration QA report — SWHR-S-0014                                                                    | DONE (#102), verdict PASS                       |
| SWHR-T-0142 | TASK  | Sprint close bundle — SWHR-S-0014                                                                      | this file                                       |

## What shipped

The sprint goal "SWHR-I-0011: Order fulfillment" is met. Change `swhr-i-0011-order-fulfillment` adds the `order-fulfillment` capability; its scenarios merge into `openspec/specs/` at close. An approved order now reaches the supplier, ships whole lines from stock, is invoiced back and becomes SHIPPED_PART or COMPLETED with no manual step.

- **Data model.** Migration 0008 adds `orderWorkflow`, `orderLines.quantityShipped` (default 0), `supplierInventory`, and cascading delete on the supplier order's contact, address and lines. (SWHR-T-0134)
- **Messaging.** `WorkflowStepError` keeps the root cause of a failed step, `resolveChannel` fails fast with `DependencyResolutionError` instead of falling back, and the new channel `opc.completed-order` feeds customer notification. (SWHR-T-0136)
- **Purchase orders.** `createPurchaseOrder` is strict and atomic and rejects a duplicate id. `persistPurchaseOrder` checks first, so redelivery stays a no-op. The snapshot returns billing and shipping contact (both the one stored contact) and each line's shipped quantity. Lines can only have their shipped quantity changed or be copied. (SWHR-T-0135)
- **Workflow tracking.** `lib/orders/workflow.ts` owns order status. Migration 0009 copies every status into `orderWorkflow` and drops `purchaseOrders.status`. Approval and invoicing go through the guarded `transition`, and the admin order lists read status from the new table. (SWHR-T-0137)
- **Order processing centre.** The `opc.invoice` consumer adds invoiced quantities to matching lines and ignores unknown items. The order is COMPLETED only when every line's shipped quantity equals its ordered quantity; completion raises one `opc.completed-order` message. Otherwise the order is SHIPPED_PART. The approval step now runs inside `runStep`. (SWHR-T-0138)
- **Supplier fulfilment.** A received supplier order ships each line whose full quantity is in stock, lowest line number first, and invoices only the lines of that attempt. `applyStockUpdate` sets absolute quantities, re-tries every PENDING supplier order in its own savepoint and publishes their invoices in the same transaction. Stock for EST-1 to EST-29 is seeded at 10000 on an empty table. (SWHR-T-0139)
- **Proof.** `lib/b2b/scenarios/order-fulfillment.test.ts` drives intake to COMPLETED, including an order that waits for stock until `applyStockUpdate` releases it. `e2e/order-fulfillment.spec.ts` checks out an en_US order and sees it COMPLETED in the admin data. (SWHR-T-0140)

## Divergence from plan

The seven tasks ran in the planned dependency order. Planning-time spec discrepancies SD-1 to SD-10 are recorded in the change's `design.md` §Sprint planning and were built as resolved there. Delivery deviations, each recorded in its ticket summary:

- SWHR-T-0136: no new outbox cases were added. The existing dispatcher tests already covered in-transaction enqueue, retry and dead letter.
- SWHR-T-0137: migration 0009 is generated except for one hand-added `INSERT INTO orderWorkflow ... SELECT` before the table rebuild, which keeps existing statuses. `orderWorkflow` has no cascade, so test fixtures clear it themselves.
- SWHR-T-0139: `supplierIntake.ts` needed no change. `getSupplierOrder` gained an optional executor and orders lines by line number.
- SWHR-T-0140: SWHR-C-0385 (stock update releases a waiting order) is proved at integration level, not E2E, because the stock edit screen ships with swhr-i-0012 (SD-6). The E2E journey asserts both orders reach COMPLETED but not the per-shipment invoice count, which no admin view shows. The ticket has no valid red run because the behaviour was already built.

## Verification

The verdict is PASS. All 50 delta scenarios pass and all 50 approved cases (SWHR-C-0340 to SWHR-C-0389) have a passing citing test. Lint, typecheck, build and 963 unit tests are green, and Chromium E2E passed 70 of 70 with none skipped. No integration defects were found. See [qa-test-report.md](qa-test-report.md), [integration-test-result.md](integration-test-result.md) and [integration-defects-resolution.md](integration-defects-resolution.md).

## Root docs

- **ARCHITECTURE.md** was updated by SWHR-T-0131 at planning: the `lib/supplier/` line, the `opc.invoice` and `opc.completed-order` channels, the stock seed, `order_workflow` and `supplier_inventory` in the data model, and the Key Decision "A stock change re-fulfils in the same transaction". What shipped matches, so it is unchanged at close.
- **PRODUCT.md** was updated at planning to describe the supplier boundary as built. Its capability map and goals 3, 7 and 8 already describe what shipped, so it is unchanged at close.
- **DESIGN.md** is unchanged. The change has no screen of its own.
- **AGENTS.md** is human-authored and was not touched.

No dated Changelog entry was added. The planning role forbids new changelog entries, and the commit message records the change.

## Open items

The sprint was not conditionally approved, so there is no Known Issues section. These items stay open after close:

- **Completion e-mail not sent yet (SD-7).** Completed-order notices queue on `opc.completed-order`, and shipment notices on `opc.invoice`. They stay pending until customer-notifications (swhr-i-0013) registers its consumer.
- **Stock edit surface (SD-6).** `applyStockUpdate` is the only way to change stock. Supplier inventory (swhr-i-0012) must call it, and SWHR-C-0385 can move to E2E then.
- **Supplier boundary (SD-4).** Supplier orders and invoices cross in-process as partner XML on the outbox. PRODUCT Open question 3 still wants a human to confirm this.
- **Status guard (SD-8).** An invoice for an order that is not APPROVED or SHIPPED_PART updates its lines but not its status. `updateStatus` itself stays unguarded, as SWHR-R-0203 requires.
- **Case-coverage self-check.** `lib/b2b/scenarios/coverage.test.ts` checks only swhr-i-0004, so nothing stops this change's cases losing their citing tests. Raised as an improvement at close.

## Defects Raised

None. No DEFECT ticket was created during the sprint.

## Retrospective

- **Went well:** zero integration defects for the second sprint running, and all 50 scenarios passed on first verification.
- **Went well:** the planning-time codebase findings (SD-2) named which tasks were already largely built. Tickets added only the missing pieces and scenario tests, and the seven tasks finished in about an hour.
- **Went well:** moving status to its own table was a two-migration change that touched every status reader, and the admin API tests passed unchanged in behaviour.
- **Could improve:** a harness-only ticket (SWHR-T-0140) cannot produce a valid red run when the behaviour already exists. Proof tickets should be folded into the task that builds the behaviour.
- **Could improve:** SWHR-T-0139's first E2E run had one flaky smoke test. It passed on rerun but was not investigated.
- **Could improve:** case-to-test traceability for this change was checked by a one-off script at QA. The committed coverage test should cover every change.

## Compliance / Control Evidence

| Control                        | Evidence                                                       | Location                                                                                     | Status    | Exception                                        |
| ------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------ |
| Work planned before execution  | Change proposal, design, spec delta, tasks; per-ticket PLAN.md | `openspec/changes/swhr-i-0011-order-fulfillment/` (archived at close), `SWHR-T-01xx/PLAN.md` | Satisfied | —                                                |
| Tests executed per ticket      | TDD result per ticket                                          | `artifacts/SWHR-S-0014/SWHR-T-0134` … `SWHR-T-0140/tdd-test-result.md`                       | Partial   | SWHR-T-0140 has no valid red run                 |
| Change verified before release | QA report, PASS, 50/50 scenarios, 70/70 E2E                    | `artifacts/SWHR-S-0014/qa-test-report.md`                                                    | Satisfied | —                                                |
| Defects dispositioned          | 0 integration defects                                          | `artifacts/SWHR-S-0014/integration-defects-resolution.md`                                    | Satisfied | —                                                |
| Spec/PRD consistency           | SD-1 to SD-10 recorded with resolutions                        | `openspec/changes/swhr-i-0011-order-fulfillment/design.md` §Sprint planning                  | Partial   | SD-4 awaits a human; SD-6/SD-7 await later ideas |
| Release approval               | Sprint reached SPRINT_CLOSE via `validation.all_acs_passed`    | SWHR-T-0141                                                                                  | Satisfied | Human approver: Not Provided                     |
