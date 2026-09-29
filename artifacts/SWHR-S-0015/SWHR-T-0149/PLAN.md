# PLAN — SWHR-T-0149: Update unit of work (task group 3)

Change: `swhr-i-0012-supplier-inventory`. Read its `design.md` §"Sprint planning — SWHR-S-0015" first. Requirements: **Stock update re-attempts pending supplier orders**.

## Design reference

No design blocks apply: this ticket has no screen. The screens are SWHR-T-0152's (`artifacts/SWHR-S-0015/design/`).

## Objective

One call that plans the batch, writes stock, re-fulfils waiting supplier orders and queues their invoices in a single transaction, and rolls all of it back when re-fulfilment fails.

## Steps

1. Read P3, SD-2 and SD-5, then `lib/supplier/stock.ts` and its test.
2. Write the tests first in `lib/supplier/inventoryUpdate.test.ts`, titled SWHR-C-0398, SWHR-C-0399 and SWHR-C-0400. Seed supplier orders the way `lib/supplier/stock.test.ts` does, and count `opc.invoice` outbox messages for "invoice sent". For SWHR-C-0400, make re-fulfilment throw a plain error (mock `./fulfilment` the way SWHR-C-0386 does, throwing from `fulfil`) and assert stock, the order line and the returned/thrown result are all unchanged. Add one case that a rejected plan writes nothing.
3. Add `lib/supplier/errors.ts` with `InvoiceBuildError` (sets `.cause`). In `fulfilSupplierOrder`, wrap `buildSupplierInvoice` so a failure throws `InvoiceBuildError`; it is already built before any write. In `refulfilPendingSupplierOrders`, catch only `InvoiceBuildError` and rethrow anything else. Update the function's comment.
4. Implement `updateInventory` per P3 on top of `listStockRecords` (SWHR-T-0147), `planStockBatch` (SWHR-T-0148) and the unchanged `applyStockUpdate` signature.
5. Confirm `lib/supplier/stock.test.ts` SWHR-C-0386 and `lib/b2b/scenarios/order-fulfillment.test.ts` still pass. Change them only if an assertion depended on a non-invoice error being swallowed.

## File/module ownership

- new `lib/supplier/inventoryUpdate.ts`, `lib/supplier/inventoryUpdate.test.ts`, `lib/supplier/errors.ts`
- `lib/supplier/stock.ts`, `lib/supplier/stock.test.ts`

Do not touch `lib/supplier/inventory.ts`, `lib/supplier/stockBatch.ts` or `lib/supplier/fulfilment.ts`.

## Definition of Done

AC-1 to AC-4 of the ticket.
