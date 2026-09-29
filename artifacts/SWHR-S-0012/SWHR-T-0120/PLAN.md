---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0012
ticket: SWHR-T-0120
branch: vortex/sprint/swhr-s-0012-057cab7b
upstream: [openspec/changes/swhr-i-0010-order-approval/design.md]
downstream:
  [
    artifacts/SWHR-S-0012/SWHR-T-0120/tdd-test-result.md,
    artifacts/SWHR-S-0012/SWHR-T-0120/summary.md,
  ]
---

# PLAN — SWHR-T-0120: Automatic approval on order intake

Change: `swhr-i-0010-order-approval` · Tasks group 2 · Requirements: **Automatic approval threshold**, **Orders in other locales await review**

## Design reference

No UI in this ticket. The sprint's mockups are under `artifacts/SWHR-S-0012/design/` (index: `MANIFEST.md`); they are not needed here.

## Objective

A newly stored en_US order under 500, or a ja_JP order under 50000, is approved with no administrator. It goes through the same decision queue and processor as an administrator decision. Every other order, including every zh_CN order, stays PENDING.

## Steps

1. Read `openspec/changes/swhr-i-0010-order-approval/design.md`, first §Legacy flow step 1 and D1, then §Sprint planning P1, P4 and P5.
2. In `lib/orders/approvalPolicy.ts`, add `shouldAutoApprove(locale, totalMinor)` (P1): strictly less-than, no conversion, and false for a null threshold or an unknown locale.
3. Make `persistPurchaseOrder` in `lib/orders/store.ts` return `boolean`, true when it inserted. Existing callers ignore the result.
4. In `lib/orders/intake.ts`, when the commit inserted and `shouldAutoApprove(po.locale, decimalToMinor(po.totalPrice, po.locale))` holds, enqueue `writeOrderApproval([{ orderId: po.orderId, status: "APPROVED" }])` on `opc.order-approval` in the same `tx` (P5).
5. Integration tests in `lib/orders/intake.test.ts` run the intake handler, then deliver with `dispatchPending` or the approval handler from SWHR-T-0121, then read `purchaseOrders.status`:
   - [SWHR-C-0287] en_US 499.99: APPROVED, and not in a PENDING query.
   - [SWHR-C-0288] en_US 500.00: PENDING, and no `opc.order-approval` message.
   - [SWHR-C-0289] ja_JP 49999: APPROVED.
   - [SWHR-C-0290] ja_JP 50000: PENDING.
   - [SWHR-C-0291] zh_CN 1.00: PENDING, and in a PENDING query.
   - Also: a redelivered purchase order enqueues no second approval.
6. Unit tests for `shouldAutoApprove` boundaries in `lib/orders/approvalPolicy.test.ts` (task 2.3).

## File/module ownership

- `lib/orders/approvalPolicy.ts`, `lib/orders/approvalPolicy.test.ts` (add `shouldAutoApprove`)
- `lib/orders/intake.ts`, `lib/orders/intake.test.ts`
- `lib/orders/store.ts`, `lib/orders/store.test.ts` (the return value only)

Consumes unchanged: `writeOrderApproval`, `enqueue` and `createOrderApprovalHandler`. Fixed interface: `shouldAutoApprove(locale: string, totalMinor: number): boolean` and `persistPurchaseOrder(tx, po): boolean`.

## Definition of Done

AC-1 to AC-5 by the tests above, each titled with its case key.
