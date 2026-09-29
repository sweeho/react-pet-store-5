---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0012
ticket: SWHR-T-0121
branch: vortex/sprint/swhr-s-0012-057cab7b
upstream: [openspec/changes/swhr-i-0010-order-approval/design.md]
downstream:
  [
    artifacts/SWHR-S-0012/SWHR-T-0121/tdd-test-result.md,
    artifacts/SWHR-S-0012/SWHR-T-0121/summary.md,
  ]
---

# PLAN — SWHR-T-0121: Decision processing

Change: `swhr-i-0010-order-approval` · Tasks group 3 · Requirements: **Decisions apply only to pending orders**, **Applying an approval decision**

## Design reference

No UI in this ticket. The sprint's mockups are under `artifacts/SWHR-S-0012/design/` (index: `MANIFEST.md`); they are not needed here.

## Objective

Add a consumer on `opc.order-approval`. It applies each decision only to a PENDING order, sends one supplier purchase order per approval, and queues one customer notice per batch listing the orders that changed, all in the dispatcher's transaction.

## Steps

1. Read `openspec/changes/swhr-i-0010-order-approval/design.md`, first §Legacy flow step 4 and D3, then §Sprint planning P2, P3 and P4, and SD-5 and SD-10.
2. Add `lib/orders/approval.ts` with `applyApprovalBatch` and `createOrderApprovalHandler` (P4):
   - The conditional update is `UPDATE … WHERE status = 'PENDING' RETURNING`, through drizzle.
   - The `SupplierOrder` is built from `getStoredOrder(orderId, tx)` and sent with `sendSupplierPurchaseOrders(tx, [so])`.
   - One notice is enqueued with `enqueue(tx, "opc.approval-notice", writeOrderApproval(changed))`, only when something changed.
3. Add `plugins/order-approval.ts`, which registers `("opc.order-approval", "order-approval")`. Mirror `plugins/order-intake.ts` and its test.
4. Integration tests in `lib/orders/approval.test.ts` seed stored orders with `persistPurchaseOrder` and read `outboxMessages` by channel:
   - [SWHR-C-0306] 1001 is APPROVED and 1002 PENDING, and both are approved. Only 1002 changes; there is one supplier PO, for 1002, and the notice lists only 1002.
   - [SWHR-C-0307] 1001 is approved and 1002 denied. 1001 is APPROVED and 1002 DENIED; there is one `supplier.purchase-order` message, for 1001, and one `opc.approval-notice` listing both.
   - [SWHR-C-0308] An en_US order of 120.00, given the one-entry APPROVED document that auto-approval emits (P5), gets the same supplier PO and notice as the administrator path.
   - Also: an unknown order id is ignored with no side effects; redelivering a processed batch changes nothing and sends nothing; a malformed payload makes the handler throw, so the dispatcher retries.

## File/module ownership

- `lib/orders/approval.ts`, `lib/orders/approval.test.ts` (new)
- `plugins/order-approval.ts`, `plugins/order-approval.test.ts` (new)

Consumes unchanged: `readOrderApproval`, `writeOrderApproval`, `enqueue`, `getStoredOrder`, `sendSupplierPurchaseOrders` and `minorToDecimal`. Fixed interface: `applyApprovalBatch(tx, entries): string[]` and `createOrderApprovalHandler(): Handler`.

## Definition of Done

AC-1 to AC-3 by the tests above, each titled with its case key.
