# SWHR-T-0110 summary

- `lib/orders/intake.ts`: `createOrderIntakeHandler()`. Prepare is `readPurchaseOrder`, commit is `persistPurchaseOrder` in the dispatcher's transaction. A read error propagates, so the delivery is retried or marked dead.
- `plugins/order-intake.ts`: Nitro plugin registering it for `("opc.purchase-order", "order-intake")`. Unlike the dispatcher plugin it also registers under Vitest, since registration has no timer.
- Tests: `lib/orders/intake.test.ts` (C-0271, C-0272, exactly-once, malformed payload) and `plugins/order-intake.test.ts`.

AC-1 and AC-2 covered. Verification: platform red then green recorded; `bun run verify` exit 0 (807 tests). Because the outbox is in the same SQLite database, "no connection left open" is shown as no transaction left open (a following unit of work commits), per SD-4.
