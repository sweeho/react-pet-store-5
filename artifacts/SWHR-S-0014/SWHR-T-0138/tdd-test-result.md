---
ticket: SWHR-T-0138
---

# TDD result — SWHR-T-0138

## Test cases

SWHR-C-0354, 0366-0370 in `lib/orders/invoice.test.ts`; SWHR-C-0363-0365, 0371 in `lib/orders/approval.test.ts`; SWHR-C-0362 in `lib/orders/intake.test.ts`. Titles carry the case keys.

## Red run

Platform run `2ec922cf-51f8-43b1-8056-2542e1fe3947` (commit 28c37b4): valid. Invoice cases failed on the stub; approval and intake cases failed on assertions. A first attempt (`0480b169-1239-42f7-bd79-8d01deaec279`) was refused because C-0362 to C-0365 passed against existing behaviour; those tests now also assert that a failing approval step surfaces as a `workflow step "order-approval" failed` error, which needs this ticket's `runStep` wrapper.

## Green run

Recorded through `a2a_run_tests(phase: "green")` after the implementation commit. Full gate `bun run verify`: exit 0, 943 tests passed.

## Notes

Plugin test `plugins/order-fulfillment.test.ts` is uncited (no linked case).

TDD-RESULT: 943 passed, 0 failed
