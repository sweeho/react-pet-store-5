# PLAN — SWHR-T-0137: Order workflow tracking (task group 3)

Change: `swhr-i-0011-order-fulfillment`. Read its `design.md` §"Sprint planning — SWHR-S-0014" first. Requirements: **Order workflow status record**, **Order workflow lifecycle** (approval, denial), **Starting order workflow tracking**, **Reading and updating order workflow status**, **Listing orders by workflow status**, **Workflow tracking operations are transactional**.

## Design reference

No design blocks: this capability has no screens (the change's design.md §User interface).

## Objective

The order's status lives in `orderWorkflow`, behind one module, and every existing reader and writer uses it. Nothing the administrator sees changes.

## Steps

1. Read design P3, SD-1 and SD-8, and §Risks.
2. Write the scenario tests first in a new `lib/orders/workflow.test.ts`, titled with their case keys. The rollback case (SWHR-C-0361) runs a step that transitions 1001 inside `db.transaction` and then throws.
3. Add `OrderNotFoundError` and `WorkflowCreateError` to `lib/orders/errors.ts`, then implement `lib/orders/workflow.ts` per P3, including the lifecycle table behind `transition`.
4. Move the status:
   - `persistPurchaseOrder` calls `startTracking` after `createPurchaseOrder`.
   - `applyApprovalBatch` replaces its conditional `purchaseOrders` update with `transition(tx, id, status)`.
   - `adminData.ts` and `getStoredOrder` read status from `orderWorkflow`.
5. Drop `purchaseOrders.status` from `db/schema.ts`. Generate migration 0009, then add the one `INSERT INTO orderWorkflow ... SELECT` before the column drop (P3). Add an upgrade test from a populated 0008 database whose orders hold several statuses.
6. Keep `routes/api/admin/order-data.test.ts`, `lib/orders/approval.test.ts`, `lib/orders/intake.test.ts` and `e2e/order-approval.spec.ts` green. Change a test only where it reads or seeds `purchaseOrders.status` directly, and then only to seed through `startTracking` or `updateStatus`.

## File/module ownership

- new `lib/orders/workflow.ts`, `lib/orders/workflow.test.ts`
- `lib/orders/errors.ts` (adds to SWHR-T-0135's file)
- `lib/orders/store.ts` (status read, `startTracking` call only)
- `lib/orders/approval.ts` (the conditional update only)
- `lib/orders/adminData.ts`
- `db/schema.ts`, `drizzle/0009_*.sql`, `drizzle/meta/*`, `lib/db/migrate.test.ts`
- test fixtures that seed status: `lib/orders/*.test.ts`, `routes/api/admin/*.test.ts`, `src/pages/admin/*.test.tsx` if any

## Definition of Done

AC-1 to AC-11 of the ticket.
