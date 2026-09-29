# PLAN — SWHR-T-0139: Supplier fulfilment (task group 6)

Change: `swhr-i-0011-order-fulfillment`. Read its `design.md` §"Sprint planning — SWHR-S-0014" first. Requirements: **Supplier purchase order record**, **Supplier purchase order creation**, **Supplier purchase order statuses**, **Supplier handling of a received purchase order**, **Whole-line shipment from stock**, **Partial shipment across lines and supplier order completion**, **Supplier invoice content**, **Re-fulfilment of pending supplier orders on stock update** (invoice build failure), **Supplier message channels**, **Order processing steps are atomic and retried** (unparseable supplier PO).

## Design reference

No design blocks: this capability has no screens (the change's design.md §User interface).

## Objective

A received supplier order ships every line that stock fully covers, is invoiced for exactly those lines, and completes when all lines have shipped. A stock update re-tries every PENDING supplier order. The supplier-intake consumer is registered at last (SD-2), and a fresh database has stock.

## Steps

1. Read design P6, SD-4, SD-5, SD-6, SD-10 and legacy finding F4.
2. Write the scenario tests first, titled with their case keys:
   - pure SWHR-C-0379 to SWHR-C-0383 in `lib/supplier/fulfilment.test.ts`;
   - database-backed SWHR-C-0373 to SWHR-C-0378, SWHR-C-0384, SWHR-C-0386 and SWHR-C-0387 in `lib/supplier/stock.test.ts` and `lib/b2b/exchange/supplierIntake.test.ts`;
   - SWHR-C-0372 in `supplierIntake.test.ts`.

   SWHR-C-0387 runs a dispatcher round so the `order-fulfillment` consumer from SWHR-T-0138 receives the invoice. SWHR-C-0384 uses a fixed clock.

3. Implement `lib/supplier/fulfilment.ts` (pure `fulfil`, `buildSupplierInvoice`) and `lib/supplier/stock.ts` (`fulfilSupplierOrder`, `refulfilPendingSupplierOrders` with one savepoint per order, `applyStockUpdate`) per P6.
4. Add `listSupplierOrderIdsByStatus` to `lib/b2b/exchange/supplierOrders.ts`, and order its lines by line number.
5. Add `plugins/supplier-intake.ts` (+ test), registering `createSupplierIntakeHandler({ shipOnReceipt })` with `shipOnReceipt` built on `fulfilSupplierOrder`, inside `runStep`.
6. Add `db/seed/inventory.ts` and call it from `db/client.ts` once per empty `supplierInventory`, following the catalog seed (P6).

## File/module ownership

- new `lib/supplier/fulfilment.ts`, `fulfilment.test.ts`, `stock.ts`, `stock.test.ts`
- `lib/b2b/exchange/supplierOrders.ts`, `supplierOrders.test.ts`, `supplierIntake.test.ts`
- `lib/b2b/exchange/supplierIntake.ts` (only if `shipOnReceipt`'s signature needs `now`)
- new `plugins/supplier-intake.ts`, `plugins/supplier-intake.test.ts`
- new `db/seed/inventory.ts`, `db/client.ts` (the seed call only)

## Definition of Done

AC-1 to AC-15 of the ticket.
