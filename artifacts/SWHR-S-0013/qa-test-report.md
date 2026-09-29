---
artifact: qa-test-report
sprint: SWHR-S-0013
ticket: SWHR-T-0129
author: validation
---

# QA test report — SWHR-S-0013 (SWHR-T-0125 blank checkout e-mail)

## Executive Summary

The fix holds: with no billing e-mail and no account e-mail, `placeOrder` now throws the missing-form-data failure naming `billing.email` and queues nothing. All 3 scenarios pass. Lint, typecheck, build, unit (823/823) and Playwright E2E (64/64, 0 skipped) ran green on the integrated branch. No defects.

## E2E Test Status

`bun run test:e2e` → `64 passed (21.9s)`, exit 0, no skips. `e2e/checkout.spec.ts` ran 2 tests, including [SWHR-C-0265]. Details in `integration-test-result.md`. No browser journey covers the blank-e-mail path; it is covered at route level (below).

## Unit Test Results

`bun run test` → `Test Files  168 passed (168)`, `Tests  823 passed (823)`, exit 0. `bun run test routes/api/orders/index.test.ts` → `Tests  13 passed (13)`. `bun run lint`, `bun run typecheck`, `bun run build` each exit 0.

## Code Review

Inspected the sprint diff: `lib/checkout/placeOrder.ts` adds `if (!email) throw new MissingFormDataFailure(["billing.email"])` after the `billing.email || account.contactInfo.email` fallback and before the transaction, so no id is consumed and nothing is queued. The fallback is unchanged. `routes/api/orders/index.test.ts` adds [SWHR-C-0460] and a fallback test. No forbidden files touched.

## Coverage Summary

No coverage tool is declared and none was run; no percentage claimed. Every scenario in the delta spec has an executed test (verdicts below).

## Issues Found

None. No SPEC-GAPs.

SCENARIO-VERDICT: Required billing and shipping contact fields / A required shipping field is blank — pass (evidence: routes/api/orders/index.test.ts SWHR-C-0262)
SCENARIO-VERDICT: Required billing and shipping contact fields / Optional fields are blank — pass (evidence: lib/checkout/contact.test.ts SWHR-C-0263)
SCENARIO-VERDICT: Required billing and shipping contact fields / No contact e-mail anywhere — pass (evidence: routes/api/orders/index.test.ts SWHR-C-0460)

## Recommendation

Approve: the scenarios pass and the automated gates are green on the integrated branch, per the runs above. Staging was not exercised beyond the Playwright-served build.
