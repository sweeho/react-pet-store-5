# PLAN — SWHR-T-0138: Order processing centre (task group 5)

Change: `swhr-i-0011-order-fulfillment`. Read its `design.md` §"Sprint planning — SWHR-S-0014" first. Requirements: **Order intake at the order processing centre**, **Supplier purchase order generation on approval**, **Batched customer status notification after an approval batch**, **Recording supplier shipments against an order**, **Order completion evaluation on invoice receipt**, **Order workflow lifecycle** (partial then complete shipment), **Order processing steps are atomic and retried** (send failure).

## Design reference

No design blocks: this capability has no screens (the change's design.md §User interface).

## Objective

Invoices from the supplier reach the order, add shipped quantities, and move it to SHIPPED_PART or COMPLETED with one completed-order notice. The intake and approval steps already exist and gain their scenario tests.

## Steps

1. Read design P5, SD-2, SD-7, SD-8 and legacy findings F2 and F3.
2. Write the scenario tests first, titled with their case keys:
   - intake SWHR-C-0362 in `lib/orders/intake.test.ts`: spy on `shouldAutoApprove` and read `getStatus` inside it;
   - approval SWHR-C-0363 to SWHR-C-0365 and SWHR-C-0371 in `lib/orders/approval.test.ts`. SWHR-C-0371 stubs the supplier send to throw once, runs a dispatcher round, then retries;
   - invoice SWHR-C-0366 to SWHR-C-0370 and SWHR-C-0354 in a new `lib/orders/invoice.test.ts`. Seed orders as APPROVED.
3. Implement `lib/orders/invoice.ts` (`applyInvoice`, `createOrderFulfillmentHandler`) per P5, using `setShippedQuantity`, `transition`, `enqueue(tx, "opc.completed-order", orderId)` and `runStep`.
4. Add `plugins/order-fulfillment.ts` (+ test), mirroring `plugins/order-approval.ts`. Resolve `opc.invoice` with `resolveChannel` at registration.
5. Wrap `createOrderApprovalHandler`'s commit in `runStep`. `applyApprovalBatch`'s behaviour does not change.

## File/module ownership

- new `lib/orders/invoice.ts`, `lib/orders/invoice.test.ts`
- `lib/orders/approval.ts` (the handler wrapper only), `lib/orders/approval.test.ts`
- `lib/orders/intake.test.ts`
- new `plugins/order-fulfillment.ts`, `plugins/order-fulfillment.test.ts`

## Definition of Done

AC-1 to AC-12 of the ticket.
