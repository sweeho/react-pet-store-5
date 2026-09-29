# PLAN — SWHR-T-0110: Order intake consumer

Change: `swhr-i-0009-checkout-and-order-placement` · Tasks group 4 · Requirements: **Order message is enqueued within the caller's unit of work**, **Enqueue failure is raised, never silent**

## Design reference

No UI in this ticket. The sprint's mockups are under `artifacts/SWHR-S-0011/design/` (index: `MANIFEST.md`); they are not needed here.

## Objective

Deliver each committed purchase-order message on `opc.purchase-order` to order processing exactly once. Here that means storing it with `persistPurchaseOrder`, registered at server start. Prove that a rolled-back or failed enqueue never reaches it.

## Steps

1. Read `openspec/changes/swhr-i-0009-checkout-and-order-placement/design.md`: §Mapping to the rebuild stack (Asynchronous hand-off), then §Sprint planning P3, P7, SD-4 and SD-6. Read `lib/messaging/dispatcher.ts` for the prepare and commit contract.
2. Add `lib/orders/intake.ts` `createOrderIntakeHandler()`:
   - prepare is `readPurchaseOrder(payload)`
   - commit is `(tx) => persistPurchaseOrder(tx, po)`
   - a read error propagates, so the dispatcher retries or marks the delivery dead; nothing is dropped
3. Add `plugins/order-intake.ts`, a Nitro plugin that registers the handler for `("opc.purchase-order", "order-intake")`. Mirror `plugins/outbox-dispatcher.ts`.
4. Tests in `lib/orders/intake.test.ts`:
   - [SWHR-C-0271] Enqueue inside `db.transaction` that then throws; `dispatchPending` delivers nothing to a captured consumer.
   - [SWHR-C-0272] `enqueue` stubbed to throw inside a unit of work; the error reaches the caller, nothing written in that unit persists, and a following `db.transaction` succeeds (no transaction left open, SD-4).
   - A committed order is stored once, and a redelivery is a no-op.
   - A malformed payload is not marked delivered.
5. `plugins/order-intake.test.ts`: the plugin registers the consumer.

## File/module ownership

- `lib/orders/intake.ts`, `lib/orders/intake.test.ts` (new)
- `plugins/order-intake.ts`, `plugins/order-intake.test.ts` (new)

Fixed interface: `createOrderIntakeHandler(): Handler`, consumer name `"order-intake"`. Order approval (swhr-i-0010) extends this handler and does not add a second consumer.

## Definition of Done

AC-1 and AC-2 by `lib/orders/intake.test.ts`, titled with the case keys.
