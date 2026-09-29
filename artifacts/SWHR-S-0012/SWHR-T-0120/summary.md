# SWHR-T-0120 summary

A newly stored en_US order under 500.00 or ja_JP order under 50000 now gets an APPROVED decision enqueued on `opc.order-approval` in the intake transaction. The existing approval processor then sets APPROVED. zh_CN and unknown locales stay PENDING.

## Files

- `lib/orders/approvalPolicy.ts`: `shouldAutoApprove` (strict less-than; false for null threshold or unknown locale).
- `lib/orders/store.ts`: `persistPurchaseOrder` returns true when it inserted.
- `lib/orders/intake.ts`: enqueues the decision when inserted and under threshold.
- Tests: `approvalPolicy.test.ts` (boundaries), `intake.test.ts` (SWHR-C-0287 to 0291 plus redelivery enqueues no second approval).

## AC coverage

AC-1 to AC-5 by SWHR-C-0287 to 0291 (intake tests run the dispatcher for intake and approval, then read the status).

## Notes

The negative cases (0288, 0290, 0291) also assert `shouldAutoApprove` is false, so they are red against the stub.

## Verification

- `bun run lint`, `bun run typecheck`: pass.
- `bun run test`: 870 passed, 0 failed.
- Platform red run 382484cd-ed61-458c-8979-34cef9372222 (valid); green run recorded after the implementation commit.
