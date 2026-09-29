# QA test report — SWHR-S-0011

Sprint: SWHR-S-0011 · Idea: SWHR-I-0009 (Checkout and order placement) · Ticket: SWHR-T-0114 · Author: Validation

## Executive Summary

All 30 scenarios of change swhr-i-0009-checkout-and-order-placement passed. Lint, typecheck, build, unit suite (821 tests) and the full Playwright run (64 tests) all exited 0 on the integrated sprint branch. No defects found.

## E2E Test Status

`bun run test:e2e` on the built branch: `64 passed (21.3s)`, 0 failed, 0 skipped. `e2e/checkout.spec.ts` ran both of its tests (SWHR-C-0257, SWHR-C-0265). Detail in `integration-test-result.md`.

## Unit Test Results

`bun run test` (vitest, exit 0): `Test Files 168 passed (168)`, `Tests 821 passed (821)`. `bun run lint` exit 0, `bun run typecheck` exit 0, `bun install && bun run build` exit 0.

## Code Review

Not a line-by-line review of merged tickets (already reviewed per ticket). Verified by inspection that each scenario has a test citing it by title (for example lib/ids/counter.test.ts SWHR-C-0274..0279, lib/orders/store.test.ts 0280..0282, lib/orders/intake.test.ts 0271/0272, routes/api/orders/index.test.ts 0262/0270/0283, lib/errors/routing.test.ts 0284/0285, routes/api/orders/last.test.ts 0286). Verdicts below rest on those tests passing in the runs above; the UI-facing ones are also covered by src/pages/checkout, order-complete and order-error tests and e2e/checkout.spec.ts.

## Coverage Summary

No coverage tool run is declared for this project, and none was run; no coverage percentage is claimed. Coverage is by scenario: 30 of 30 scenarios have a passing test.

## Issues Found

None. No SPEC-GAP identified. Design fidelity: not compared pixel-for-pixel against the mockups (advisory, report-only); the e2e checkout journey confirms the form is pre-filled and the shell renders on /checkout.

SCENARIO-VERDICT: Checkout hands the order off asynchronously / Customer checks out a non-empty cart — pass
SCENARIO-VERDICT: Checkout hands the order off asynchronously / Order submission returns before approval — pass
SCENARIO-VERDICT: Order information screen / Form is displayed pre-filled — pass
SCENARIO-VERDICT: Order information screen / Customer edits shipping before submitting — pass
SCENARIO-VERDICT: Order information screen / Anonymous visitor requests the screen — pass
SCENARIO-VERDICT: Required billing and shipping contact fields / A required shipping field is blank — pass
SCENARIO-VERDICT: Required billing and shipping contact fields / Optional fields are blank — pass
SCENARIO-VERDICT: Empty-cart order rejection / Order submitted with an empty cart — pass
SCENARIO-VERDICT: Empty-cart order rejection / Order form re-submitted after a successful order — pass
SCENARIO-VERDICT: Purchase order contents / Purchase order is populated at submission — pass
SCENARIO-VERDICT: Order lines and total / Two-line cart — pass
SCENARIO-VERDICT: Credit card attached to every order / Order carries a card — pass
SCENARIO-VERDICT: Order hand-off to order processing / Successful hand-off — pass
SCENARIO-VERDICT: Order hand-off to order processing / Message send fails — pass
SCENARIO-VERDICT: Order message is enqueued within the caller's unit of work / Caller rolls back after enqueueing — pass
SCENARIO-VERDICT: Enqueue failure is raised, never silent / Queue cannot be reached — pass
SCENARIO-VERDICT: Order complete screen / Confirmation after a successful order — pass
SCENARIO-VERDICT: Order identifier format / First and subsequent orders — pass
SCENARIO-VERDICT: Order identifier format / Counter at 7 — pass
SCENARIO-VERDICT: Per-prefix identifier counters / New prefix — pass
SCENARIO-VERDICT: Per-prefix identifier counters / Counter creation fails — pass
SCENARIO-VERDICT: Atomic identifier issuance / Concurrent requests for the same prefix — pass
SCENARIO-VERDICT: Atomic identifier issuance / Caller rolls back — pass
SCENARIO-VERDICT: Identifier counter record / Duplicate counter name — pass
SCENARIO-VERDICT: Stored purchase order total / Supplied total is persisted verbatim — pass
SCENARIO-VERDICT: Stored purchase order contact and payment / Order contact is a snapshot — pass
SCENARIO-VERDICT: Order placement is one transaction / Failure inside order placement — pass
SCENARIO-VERDICT: Error screen selection by failure kind / Mapped failure — pass
SCENARIO-VERDICT: Error screen selection by failure kind / Unmapped failure — pass
SCENARIO-VERDICT: Consistent reads while rendering a screen / Transaction unavailable — pass

## Recommendation

Fire validation.all_acs_passed. Every scenario passed and every gate exited 0.
