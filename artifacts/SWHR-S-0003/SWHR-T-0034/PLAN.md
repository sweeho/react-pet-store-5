---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0003
ticket: SWHR-T-0034
idea: SWHR-I-0004
branch: Not Provided
upstream:
  [
    openspec/changes/swhr-i-0004-partner-document-exchange/design.md,
    openspec/changes/swhr-i-0004-partner-document-exchange/specs/b2b-document-exchange/spec.md,
  ]
---

# PLAN — SWHR-T-0034 · Exchange test suite

Change `swhr-i-0004-partner-document-exchange` · tasks.md group 7. Read `openspec/changes/swhr-i-0004-partner-document-exchange/design.md` first: §Planning (findings, P1–P9, SD-1–SD-9) and §Interface contracts. Each approved test case in `openspec/changes/swhr-i-0004-partner-document-exchange/test-cases.md` for your scenarios becomes a test whose name carries its `SWHR-C-*` id (SD-8).

## Objective

Every approved test case in `test-cases.md` is traceable to a passing test, and one flow test proves the modules work together from approved order to invoice intake.

## Steps

1. List `SWHR-C-0047`–`SWHR-C-0098` against the tests already written by SWHR-T-0028 to SWHR-T-0033 (each carries its id in its name). For any case without a test, add it under `lib/b2b/scenarios/`. Do not rewrite existing tests.
2. `lib/b2b/scenarios/order-to-invoice.test.ts`. Register test consumers for both invoice subscribers and a `shipOnReceipt` that ships every line. Send two orders with `sendSupplierPurchaseOrders`, then run `dispatchPending` until idle. Assert two `supplier_orders` rows, two invoice messages, four delivered invoice deliveries, and that each consumer's `readPartnerInvoice` returns the right order id and quantities.
3. `lib/b2b/scenarios/coverage.test.ts`: read `test-cases.md`, collect every `SWHR-C-*` id, and assert that each appears in at least one test title under `lib/b2b/`. This makes AC-1 self-checking.
4. If a gap shows a behaviour defect in another ticket's module, file a defect rather than editing a file outside this ownership map.

## File/module ownership

- `lib/b2b/scenarios/**` (new)

## Definition of Done

- AC-1 (every approved test case covered and passing)
- AC-2 (end-to-end order-to-invoice flow)
