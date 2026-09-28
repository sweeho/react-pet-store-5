---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0003
ticket: SWHR-T-0033
idea: SWHR-I-0004
branch: Not Provided
upstream:
  [
    openspec/changes/swhr-i-0004-partner-document-exchange/design.md,
    openspec/changes/swhr-i-0004-partner-document-exchange/specs/b2b-document-exchange/spec.md,
  ]
---

# PLAN — SWHR-T-0033 · Asynchronous exchange

Change `swhr-i-0004-partner-document-exchange` · tasks.md group 5. Read `openspec/changes/swhr-i-0004-partner-document-exchange/design.md` first: §Planning (findings, P1–P9, SD-1–SD-9) and §Interface contracts. Each approved test case in `openspec/changes/swhr-i-0004-partner-document-exchange/test-cases.md` for your scenarios becomes a test whose name carries its `SWHR-C-*` id (SD-8).

## Objective

One SQLite outbox and dispatcher carries supplier purchase orders point-to-point and fans each invoice out to two consumers. Supplier intake is atomic: nothing is recorded, and the message is redelivered, whenever parsing, validation, persistence or invoice publication fails.

## Steps

1. `db/schema.ts`: `outbox_messages`, `outbox_deliveries` (design.md P4), `supplier_orders`, `supplier_contacts`, `supplier_addresses` and `supplier_line_items` (design.md P5). Generate and commit the migration.
2. `lib/messaging/outbox.ts` and `lib/messaging/dispatcher.ts`, per §Interface contracts and P4: fixed subscriber lists, delivery rows at enqueue, prepare-then-commit inside one `db.transaction()`, and on failure `attempts + 1` and a retry time. `OUTBOX_MAX_ATTEMPTS` (default 10) moves a delivery to `dead`. An unregistered consumer leaves its delivery pending.
3. `plugins/outbox-dispatcher.ts`: poll `dispatchPending` every `OUTBOX_POLL_MS` (default 1000). Inactive when `VITEST` is set. Add `plugins` to `tsconfig.node.json`'s `include`.
4. `lib/b2b/exchange/supplierChannel.ts`: `sendSupplierPurchaseOrders`, one `buildPartnerSupplierOrder` message per order.
5. `lib/b2b/exchange/invoiceChannel.ts`: `publishInvoices`, one `buildPartnerInvoice` message per invoice.
6. `lib/b2b/exchange/supplierIntake.ts`: `createSupplierIntakeHandler`. Prepare = `intakeSupplierOrder` (a `DocumentInvalidError` or `MalformedDocumentError` fails the delivery). Commit = persist the order (status `PENDING`, prices converted to integer minor units exactly), then `publishInvoices(tx, shipOnReceipt(tx, order))`. With validation off, `intakeSupplierOrder` skips schema validation (`SWHR-R-0047.02`).
7. tasks.md 5.1 is already done at planning (the Key Decision is recorded). Nothing to build for it.

## File/module ownership

- `db/schema.ts` (the new tables only), `drizzle/` (the generated migration and meta)
- `lib/messaging/**` and tests (new)
- `lib/b2b/exchange/**` and tests (new)
- `plugins/outbox-dispatcher.ts` (new), `tsconfig.node.json` (the `plugins` include only)

## Definition of Done

- AC-1 … AC-7, in the ticket's order. Channel tests register test consumers for `order-fulfillment` and `customer-notification` (design.md SD-3).
