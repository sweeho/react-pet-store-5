---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0014
idea: SWHR-I-0011
branch: vortex/sprint/swhr-s-0014-c83c7c4f
upstream: [artifacts/SWHR-S-0014/qa-test-report.md, artifacts/SWHR-S-0014/sprint-summary.md]
---

# Release notes — SWHR-S-0014

## Added

- **Supplier fulfilment.** An approved order goes to the supplier as one purchase order. The supplier ships each line whose full quantity is in stock and holds the rest; a line never ships in part. (SWHR-T-0138, SWHR-T-0139)
- **Invoices and order completion.** Every shipment sends an invoice back. The order becomes Shipped (part) after a partial shipment and Completed once every line has shipped exactly its ordered quantity. The administrator's non-pending order list shows these statuses. (SWHR-T-0137, SWHR-T-0138)
- **Restock releases waiting orders.** A stock update re-tries every waiting supplier order in the same transaction, ships the lines now covered and invoices them, and the customer's order completes without administrator action. (SWHR-T-0139)
- **Supplier stock.** Every item (EST-1 to EST-29) starts with 10000 units on a fresh database. (SWHR-T-0139)
- **Nothing lost on restart.** Placing an order still returns straight away. Approval hand-off, shipment and invoicing run in the background and retry after a failure without sending anything twice. (SWHR-T-0136, SWHR-T-0138)

## Changed

- Order status is now kept in its own record rather than on the order. The admin order lists and `POST /api/admin/order-data` read from it and answer as before. (SWHR-T-0137)
- A purchase order id can be stored only once; redelivery of the same order is still ignored. (SWHR-T-0135)

## Upgrade notes

- Two migrations run at startup. 0008 adds the order-workflow, stock and shipped-quantity storage. 0009 copies every existing order status into the new record and then drops the old status column, so no status is lost.
- The stock seed runs only when the supplier stock table is empty.
- New outbox channel `opc.completed-order`. Invoices on `opc.invoice` now have a consumer, registered by a Nitro plugin at startup, as is supplier intake.

## Known issues

- Customer shipment and completion e-mails are queued but not sent until the customer-notifications capability ships.
- There is no screen yet for supplier staff to change stock; it ships with supplier inventory.

## Not included

Customer e-mail delivery and the supplier inventory screen are later capabilities.

## Verification

Verified at integration QA with a PASS verdict. All 50 order-fulfillment scenarios pass, as do 963 unit and integration tests and 70 Chromium E2E tests. See [qa-test-report.md](qa-test-report.md).

## Compliance / Control Evidence

| Control                      | Evidence        | Location                                  | Status    | Exception |
| ---------------------------- | --------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded    | this file       | `artifacts/SWHR-S-0014/release-notes.md`  | Satisfied | —         |
| Release verified before land | QA PASS verdict | `artifacts/SWHR-S-0014/qa-test-report.md` | Satisfied | —         |
| Known limitations disclosed  | Known issues    | this file; sprint-summary.md §Open items  | Satisfied | —         |
