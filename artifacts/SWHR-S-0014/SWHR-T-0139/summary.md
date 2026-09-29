# SWHR-T-0139 summary

Adds supplier fulfilment. `lib/supplier/fulfilment.ts`: pure `fulfil` (whole-line, ascending line number, missing stock counts as 0) and `buildSupplierInvoice`. `lib/supplier/stock.ts`: `fulfilSupplierOrder`, `refulfilPendingSupplierOrders` (one savepoint per order, failures skipped) and `applyStockUpdate` (absolute quantities, re-fulfil, publish on `opc.invoice`). `plugins/supplier-intake.ts` registers the supplier-intake consumer with `shipOnReceipt` built on `fulfilSupplierOrder` inside `runStep`. `db/seed/inventory.ts` seeds EST-1 to EST-29 at 10000, called from `db/client.ts` when `supplierInventory` is empty.

Also: `getSupplierOrder` takes an optional executor and orders lines by line number; `listSupplierOrderIdsByStatus` added. `supplierIntake.ts` needed no change (its hook signature already fits).

Files: `lib/supplier/*` (+ tests), `lib/b2b/exchange/supplierOrders.ts`, `plugins/supplier-intake.ts` (+ test), `db/seed/inventory.ts`, `db/client.ts`, `lib/db/inventorySeed.test.ts`.

AC coverage: all 14 linked cases pass. SWHR-C-0385 (e2e) is out of scope per design SD-6.

Verification: `bun run verify:full` unit 961 passed; E2E 69 passed on rerun (first run had one flaky smoke test).
