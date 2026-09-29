# SWHR-T-0137 summary

Adds `lib/orders/workflow.ts` (`OrderStatus`, `startTracking`, `getStatus`, `updateStatus`, `transition`, `listOrderIdsByStatus`; all take the caller's executor) and `OrderNotFoundError`/`WorkflowCreateError`. `persistPurchaseOrder` starts tracking, `applyApprovalBatch` uses `transition`, and `getStoredOrder` and `adminData.ts` read status from `orderWorkflow`. Migration 0009 (generated, with one hand-added `INSERT INTO orderWorkflow ... SELECT` before the rebuild) drops `purchaseOrders.status`.

Files: `lib/orders/{workflow.ts,workflow.test.ts,errors.ts,store.ts,approval.ts,adminData.ts}`, `db/schema.ts`, `drizzle/0009_shallow_rick_jones.sql` and meta, `lib/db/migrate.test.ts`, and fixtures that seeded or read status (`lib/orders/{approval,intake,store,lines}.test.ts`, `routes/api/admin/order-data.test.ts`, `routes/api/orders/index.test.ts`), which now seed through `updateStatus`, read through the module and clear `orderWorkflow` because it has no cascade.

AC coverage: all ten scenarios via the case-keyed tests; upgrade keeps every status and the admin API tests pass unchanged in behaviour.

Verification: `bun run verify:full` exit 0 (930 unit, 69 E2E).
