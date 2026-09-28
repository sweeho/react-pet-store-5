---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0003
idea: SWHR-I-0004
branch: vortex/sprint/swhr-s-0003-6b5b7d75
upstream:
  [
    artifacts/SWHR-S-0003/SPRINT-PLAN.md,
    artifacts/SWHR-S-0003/qa-test-report.md,
    artifacts/SWHR-S-0003/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0003/release-notes.md]
---

# Sprint summary — SWHR-S-0003

## Tickets

| Ticket      | Type  | Title                                                                                          | Outcome                                        |
| ----------- | ----- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| SWHR-T-0025 | TASK  | Sprint plan — SWHR-S-0003                                                                      | DONE (commit b097140)                          |
| SWHR-T-0026 | EPIC  | Partner document exchange — purchase orders, supplier orders and invoices                      | DONE (rollup)                                  |
| SWHR-T-0027 | STORY | Approved orders reach the supplier and shipments come back as invoices, in the partner formats | DONE (rollup)                                  |
| SWHR-T-0028 | TASK  | XML infrastructure — parser, serializer, positional readers, validation, doctype, catalog      | DONE (#19) — [summary](SWHR-T-0028/summary.md) |
| SWHR-T-0029 | TASK  | Shared document elements — ContactInfo, Address, CreditCard, LineItem                          | DONE (#20) — [summary](SWHR-T-0029/summary.md) |
| SWHR-T-0030 | TASK  | Order documents — PurchaseOrder 1.1 and internal SupplierOrder 1.1                             | DONE (#21) — [summary](SWHR-T-0030/summary.md) |
| SWHR-T-0031 | TASK  | Partner documents — TPA supplier order, invoice, line item, schemas and intake                 | DONE (#23) — [summary](SWHR-T-0031/summary.md) |
| SWHR-T-0032 | TASK  | Version 1.0 purchase order intake                                                              | DONE (#22) — [summary](SWHR-T-0032/summary.md) |
| SWHR-T-0033 | TASK  | Asynchronous exchange — SQLite outbox, supplier channel, invoice fan-out, atomic intake        | DONE (#24) — [summary](SWHR-T-0033/summary.md) |
| SWHR-T-0034 | TASK  | Exchange test suite — test-case traceability and order-to-invoice flow                         | DONE (#25) — [summary](SWHR-T-0034/summary.md) |
| SWHR-T-0036 | TASK  | Integration QA report — SWHR-S-0003                                                            | DONE (#26), verdict PASS                       |
| SWHR-T-0037 | TASK  | Sprint close bundle — SWHR-S-0003                                                              | this file                                      |

## What shipped

Sprint goal "SWHR-I-0004: Partner document exchange" is met. The order centre and the supplier can now exchange purchase orders, supplier orders and invoices in the legacy trading-partner XML formats:

- `lib/b2b/` writes and reads every format: PurchaseOrder 1.1 (and read-only 1.0), the internal SupplierOrder 1.1, and the partner (TPA) supplier order, invoice and line item. Bundled DTD/XSD schemas are found through an entity catalog that a deployment can override, and validation can be switched per document type.
- `lib/messaging/` is the one SQLite outbox and dispatcher for every asynchronous hop. On top of it, an approved order becomes one supplier purchase order message. Supplier intake records the order and publishes its invoice in one transaction, so a failure rolls both back and the message is retried. Each invoice fans out to order fulfilment and customer notification.
- Four new tables for supplier orders and two for the outbox (`drizzle/0003_wet_boomer.sql`).

As in SWHR-S-0002, several parts are seams that nothing calls yet, because the callers belong to later ideas. `sendSupplierPurchaseOrders` has no approval flow to call it (SWHR-I-0010). The two invoice subscribers are registered channel names with no fulfilment or e-mail consumer behind them (SWHR-I-0011, SWHR-I-0013). The exchange has no screens. Each seam is covered by tests, including one flow test from order to both invoice consumers.

## Divergence from plan

- **`vitest.config.ts` edited outside SWHR-T-0033's ownership map.** The outbox plugin test needs `bun:sqlite`, so `plugins/**` was added to the Vitest server project. This follows the pattern already used for `lib/**`. The plan missed it, and the fix is narrow.
- **SWHR-T-0030 fixed a SWHR-T-0028 test.** The schema-route test used a real catalog filename as scratch space and deleted `PurchaseOrder.dtd.xsd` once that file existed. It now mocks the catalog.
- **No `LineItems` wrapper in partner documents** (SWHR-T-0031). Line items are direct children of the root, as the approved case SWHR-C-0073 and the legacy DTDs show.
- **Version 1.0 wrapper names are reconstructed** (`ShipToAddress`/`BillToAddress`, SWHR-T-0032; design SD-6, confidence low). No 1.0 DTD exists to check them against.
- Otherwise delivered to plan. No ticket was added, split or dropped.

## Verification

PASS. Lint, typecheck and 328 unit tests pass (76 files). All 28 storefront E2E tests pass, and all 52 scenarios of change `swhr-i-0004-partner-document-exchange` pass against approved cases SWHR-C-0047–SWHR-C-0098. No defects were found in integration. See [qa-test-report.md](qa-test-report.md), [integration-test-result.md](integration-test-result.md) and [integration-defects-resolution.md](integration-defects-resolution.md).

## Defects Raised

None.

## Open decisions

SWHR-T-0035 (BACKLOG) asks a human for five rulings the spec could not settle:

- whether Country is required
- whether a schema violation rejects the document
- whether version 1.0 is still needed
- whether the card number travels in clear
- whether the supplier is external or in-process (PRODUCT.md open question 3)

The shipped code follows design.md's current reading of each. The last ruling must be made before order fulfilment (SWHR-I-0011) is planned.

## Retrospective

- **Went well:** SWHR-T-0028 fixed the XML contracts first. The four document tickets then built on it with no contract change, and SWHR-T-0030/0031/0032 all reused `expectRoot` and `ChildReader` unchanged.
- **Went well:** tagging every test with its approved case id let SWHR-T-0034 prove coverage with a standing test (`lib/b2b/scenarios/coverage.test.ts`) instead of a manual audit. It found zero gaps, and QA used the same mapping for its scenario walk.
- **Could improve:** the plan's ownership maps missed two shared test-config edits: `vitest.config.ts` for a new top-level test directory, and a test fixture that collided with a later ticket's real file. Planning should list test-project config in the ownership map of any ticket that adds a new server-side test root.
- **Could improve:** again, no implementation container had Chromium, so no ticket ran E2E. This sprint had no UI, so nothing was lost, but the gap would matter on the UI-heavy ideas that come next.

## Compliance / Control Evidence

| Control                        | Evidence                                                    | Location                                                                                              | Status    | Exception                                      |
| ------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------- |
| Work planned before execution  | Change proposal, design, specs, tasks; per-ticket PLAN.md   | `openspec/changes/swhr-i-0004-partner-document-exchange/`, `artifacts/SWHR-S-0003/SWHR-T-00*/PLAN.md` | Satisfied | —                                              |
| Tests executed per ticket      | TDD results                                                 | `artifacts/SWHR-S-0003/SWHR-T-00{28..34}/tdd-test-result.md`                                          | Satisfied | E2E not run in ticket containers (no Chromium) |
| Change verified before release | QA report, PASS, 52/52 scenarios                            | `artifacts/SWHR-S-0003/qa-test-report.md`                                                             | Satisfied | —                                              |
| Defects dispositioned          | 0 integration defects                                       | `artifacts/SWHR-S-0003/integration-defects-resolution.md`                                             | Satisfied | —                                              |
| Open decisions tracked         | Rulings ticket                                              | SWHR-T-0035                                                                                           | Satisfied | Rulings pending                                |
| Release approval               | Sprint reached SPRINT_CLOSE via `validation.all_acs_passed` | SWHR-T-0036                                                                                           | Satisfied | Human approver: Not Provided                   |
