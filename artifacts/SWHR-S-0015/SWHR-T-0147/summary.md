# Summary — SWHR-T-0147

Added stock record access in `lib/supplier/inventory.ts` (`listStockRecords` in natural item-id order, `getStockRecord`, strict `createStockRecord`) per P1. The table and migration 0008 were verified unchanged (SD-1). No screen, so no design consulted.

Files: `lib/supplier/inventory.ts`, `lib/supplier/inventory.test.ts` (tests for SWHR-C-0390, -0391, -0392 plus natural-order test).

AC coverage: all four AC covered by those tests. Verification: `bun run verify` exit 0 (969 tests passed).
