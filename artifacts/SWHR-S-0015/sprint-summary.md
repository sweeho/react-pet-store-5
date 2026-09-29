---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0015
idea: SWHR-I-0012
branch: vortex/sprint/swhr-s-0015-781fce36
upstream:
  [
    artifacts/SWHR-S-0015/SPRINT-PLAN.md,
    artifacts/SWHR-S-0015/qa-test-report.md,
    artifacts/SWHR-S-0015/integration-test-result.md,
    artifacts/SWHR-S-0015/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0015/release-notes.md]
---

# Sprint summary — SWHR-S-0015

## Tickets

| Ticket      | Type  | Title                                                                                             | Outcome                                         |
| ----------- | ----- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| SWHR-T-0144 | TASK  | Sprint plan — SWHR-S-0015                                                                         | DONE                                            |
| SWHR-T-0145 | EPIC  | Supplier inventory                                                                                | DONE (rollup)                                   |
| SWHR-T-0146 | STORY | Supplier staff replace stock levels, which releases back-ordered supplier orders                  | DONE (rollup)                                   |
| SWHR-T-0148 | TASK  | Stock update rules: pure batch plan                                                               | DONE (#103) — [summary](SWHR-T-0148/summary.md) |
| SWHR-T-0147 | TASK  | Data model: supplier stock record access (list, read, strict create)                              | DONE (#104) — [summary](SWHR-T-0147/summary.md) |
| SWHR-T-0149 | TASK  | Update unit of work: stock writes, re-fulfilment and invoices in one transaction                  | DONE (#105) — [summary](SWHR-T-0149/summary.md) |
| SWHR-T-0150 | TASK  | Server API: GET and POST /api/supplier/inventory behind the supplier administrator role           | DONE (#106) — [summary](SWHR-T-0150/summary.md) |
| SWHR-T-0151 | TASK  | Initial stock load: skip when populated, forced replace, no HTTP entry point                      | DONE (#107) — [summary](SWHR-T-0151/summary.md) |
| SWHR-T-0152 | TASK  | Screens: supplier home, inventory update, no-items state, update confirmation, Playwright journey | DONE (#108) — [summary](SWHR-T-0152/summary.md) |
| SWHR-T-0153 | TASK  | Integration QA report — SWHR-S-0015                                                               | DONE (#110), verdict PASS                       |
| SWHR-T-0154 | TASK  | Sprint close bundle — SWHR-S-0015                                                                 | this file                                       |

## What shipped

The sprint goal "SWHR-I-0012: Supplier inventory" is met. Change `swhr-i-0012-supplier-inventory` adds the `supplier-inventory` capability; its scenarios merge into `openspec/specs/` at close. Supplier staff can now see every stock record, replace the quantities of the rows they tick, and so release supplier orders waiting for stock. Orders no longer stop at "approved" for lack of a stock edit surface.

- **Stock record access.** `lib/supplier/inventory.ts` adds `listStockRecords` (natural item-id order, EST-2 before EST-10), `getStockRecord` and a strict `createStockRecord` that refuses a duplicate id or a missing quantity. The table from migration 0008 was reused unchanged. (SWHR-T-0147)
- **Batch rule.** Pure `planStockBatch` in `lib/supplier/stockBatch.ts`: only ticked, non-blank rows change; the value replaces the stored one; negatives are skipped silently; zero is an update; a non-numeric or fractional value, or an unknown item id, rejects the whole batch. (SWHR-T-0148)
- **All-or-nothing update.** `updateInventory` in `lib/supplier/inventoryUpdate.ts` plans, writes stock, re-tries every pending supplier order and queues their invoices in one transaction. Re-fulfilment now skips an order only on the new `InvoiceBuildError`; any other failure rolls back the whole update, stock included. (SWHR-T-0149)
- **API.** `GET` and `POST /api/supplier/inventory`, behind the `administrator` role in the `supplier` realm. GET answers `{ items }` or 500 `INVENTORY_UNAVAILABLE`; POST answers 200 `{ updated }`, 400 `INVALID_BATCH` with nothing written, or 500 on rollback. (SWHR-T-0150)
- **Initial stock load.** `loadInitialStock(db, { force })` replaces `seedInventory`. Unforced, it loads EST-1 to EST-29 at 10000 only into an empty table; forced, it resets those items and leaves any other untouched. No HTTP route calls it. (SWHR-T-0151)
- **Screens.** `/supplier` (home: back-order explanation, Display Inventory, Logout), `/supplier/inventory` (one row per stock record, one Submit, the no-items state for an empty list or a failed GET) and `/supplier/updated` (confirmation). Built from the exported mockups with the SD-7 copy corrections. `e2e/supplier-inventory.spec.ts` drives the journey. (SWHR-T-0152)

## Divergence from plan

The six tasks ran in the planned order (P7). Planning-time spec discrepancies SD-1 to SD-9 are recorded in the change's `design.md` §Sprint planning and were built as resolved there. Delivery deviations, each recorded in its ticket summary or test result:

- SWHR-T-0150: the 500 body for a failed update is `{ error: "INVENTORY_UPDATE_FAILED" }`. P4 fixed only the status.
- SWHR-T-0151: `a2a_run_tests` timed out twice and dropped once, so no platform red or green run is recorded. The local red failed on the stub and `bun run verify` passed.
- SWHR-T-0152: the E2E spec runs its tests serially (`mode: "serial"`) because they share one stock table and raced in parallel. One type-only fix to a fetch mock followed the red run. No assertion changed.

## Verification

The verdict is PASS. All 23 delta scenarios pass and each approved case (SWHR-C-0390 to SWHR-C-0412) has a passing citing test. Lint, typecheck, build and 1004 unit tests are green, and Chromium E2E passed 74 of 74 with none skipped. No integration defects were found. Design fidelity was checked through the screen scenarios only; no pixel comparison was run. See [qa-test-report.md](qa-test-report.md), [integration-test-result.md](integration-test-result.md) and [integration-defects-resolution.md](integration-defects-resolution.md).

## Root docs

- **ARCHITECTURE.md** was updated by SWHR-T-0144 at planning: the "Supplier inventory" access line (screens, API, role, no HTTP entry point for the stock load) and the Key Decision narrowed to "all or nothing" (SD-2). What shipped matches, so it is unchanged at close.
- **PRODUCT.md** already carried the `supplier-inventory` capability line, goal 7 and the supplier restock journey before this sprint. What shipped matches, so it is unchanged.
- **DESIGN.md** is unchanged. The screens reuse existing components and tokens; no design-system change was made.
- **AGENTS.md** is human-authored and was not touched.

No dated Changelog entry was added. The planning role forbids new changelog entries, and the commit message records the change.

## Open items

The sprint was not conditionally approved, so there is no Known Issues section. These items stay open after close:

- **Lookup failure message (SD-6).** A failed stock lookup shows "There are no items in inventory.", as the spec requires. The canvas preferred an error frame with Try again, because "no stock" may prompt staff to re-key everything. The API already distinguishes the two, so a human decision changes only the page.
- **Forced stock reload (Q1).** A forced reload overwrites real stock and is reachable only as a function call. Who may run it after launch is still a human decision.
- **Customer e-mails (from SWHR-S-0014 SD-7).** Stock updates now ship waiting orders, but shipment and completion notices stay queued until customer-notifications (swhr-i-0013) registers its consumer.
- **Supplier boundary (from SWHR-S-0014 SD-4).** PRODUCT Open question 3 still wants a human to confirm the in-process partner-XML boundary.
- **Shared stock in E2E.** Specs share one stock table, so the supplier spec runs serially and never sets a level below 10. Any new spec that edits stock must follow the same rule.

## Defects Raised

None. No DEFECT ticket was created during the sprint.

## Retrospective

- **Went well:** zero integration defects for the third sprint running, and all 23 scenarios passed on first verification.
- **Went well:** the planning codebase findings (SD-1) showed most of the storage, seed and re-fulfilment already existed, so tickets added only the missing pieces. The sprint ran from start to close in under 50 minutes.
- **Went well:** SD-2 found a real conflict between the new all-or-nothing rule and shipped fulfilment code. It was settled at planning with one narrow error type, and the order-fulfillment regression tests stayed green unchanged.
- **Could improve:** the test-run tool failed for SWHR-T-0151, leaving one ticket without platform red/green evidence. A tool outage should be retried later in the run rather than recorded as missing.
- **Could improve:** the parallel E2E race in SWHR-T-0152 was found only after the red run. Plans for specs that write shared data should state serial mode up front.
- **Could improve:** the mockups disagreed with the spec on labels, Submit placement and copy (SD-7). Spec copy should be checked against mockups at ideation, before planning.

## Compliance / Control Evidence

| Control                        | Evidence                                                       | Location                                                                                      | Status    | Exception                                 |
| ------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------- | ----------------------------------------- |
| Work planned before execution  | Change proposal, design, spec delta, tasks; per-ticket PLAN.md | `openspec/changes/swhr-i-0012-supplier-inventory/` (archived at close), `SWHR-T-01xx/PLAN.md` | Satisfied | —                                         |
| Tests executed per ticket      | TDD result per ticket                                          | `artifacts/SWHR-S-0015/SWHR-T-0147` … `SWHR-T-0152/tdd-test-result.md`                        | Partial   | SWHR-T-0151 has no platform-recorded runs |
| Change verified before release | QA report, PASS, 23/23 scenarios, 74/74 E2E                    | `artifacts/SWHR-S-0015/qa-test-report.md`                                                     | Satisfied | —                                         |
| Defects dispositioned          | 0 integration defects                                          | `artifacts/SWHR-S-0015/integration-defects-resolution.md`                                     | Satisfied | —                                         |
| Spec/PRD consistency           | SD-1 to SD-9 recorded with resolutions                         | `openspec/changes/swhr-i-0012-supplier-inventory/design.md` §Sprint planning                  | Partial   | SD-6 and Q1 await a human                 |
| Release approval               | Sprint reached SPRINT_CLOSE via `validation.all_acs_passed`    | SWHR-T-0153                                                                                   | Satisfied | Human approver: Not Provided              |
