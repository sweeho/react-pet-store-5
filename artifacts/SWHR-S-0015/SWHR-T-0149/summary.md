# SWHR-T-0149 summary

Added `updateInventory` (plan, stock write, re-fulfilment and invoice queueing in one `db.transaction`; rejected plan writes nothing). Added `InvoiceBuildError`; `fulfilSupplierOrder` wraps invoice-build failures in it and `refulfilPendingSupplierOrders` now skips an order only on that error, so any other failure rolls back the whole update (SD-2). Comment on the function updated.

Files: `lib/supplier/inventoryUpdate.ts`, `inventoryUpdate.test.ts`, `errors.ts`, `stock.ts`. `stock.test.ts` unchanged (SWHR-C-0386 still passes).

AC coverage: AC-1 SWHR-C-0398, AC-2 SWHR-C-0399, AC-3 SWHR-C-0400, AC-4 interface and SWHR-C-0386.

Verification: `bun run verify` passed (lint, typecheck, 982 tests). No UI in this ticket.
