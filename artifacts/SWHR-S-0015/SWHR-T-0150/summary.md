# Summary — SWHR-T-0150

Added `GET` and `POST /api/supplier/inventory` behind `requireRole(event, "supplier", "administrator")` (P4). GET returns `{ items }` or 500 `INVENTORY_UNAVAILABLE`. POST validates the body shape, runs `updateInventory`, and answers 200 `{ updated }`, 400 `INVALID_BATCH` (rejected plan or malformed body, nothing written), or 500 (rollback). No screen, so no design consulted.

Deviation: the 500 body for a thrown update is `{ error: "INVENTORY_UPDATE_FAILED" }`; P4 fixes only the status.

Files: `routes/api/supplier/inventory.get.ts`, `inventory.post.ts`, `inventory.test.ts` (SWHR-C-0397 plus order, failure, 400, 500, 401 and 403 tests).

AC coverage: AC-1 to AC-3 by those tests. Verification: `bun run verify` exit 0.
