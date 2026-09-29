# QA test report — SWHR-S-0010

- Sprint: SWHR-S-0010 (SWHR-I-0008 Shopping cart; tickets SWHR-T-0096 to SWHR-T-0100)
- Ticket: SWHR-T-0101
- Author: Validation

## Executive Summary

All 25 shopping-cart scenarios pass on the integrated sprint branch. `bun install`, `bun run build` and `bun run verify` exit 0 (763 unit tests passed); the Playwright suite ran in Chromium (62 passed, 0 failed, 0 skipped). No defects found. Recommendation: pass.

## E2E Test Status

Executed `bun run test:e2e`; summary line `62 passed (20.4s)`, exit 0. `e2e/cart.spec.ts` ran 3 of 3 tests (none skipped). Per-spec table in `integration-test-result.md`.

## Unit Test Results

Command: `bun run verify` (eslint, `tsc --build`, `bun --bun vitest run`), exit 0.
Output: `Test Files  154 passed (154)` / `Tests  763 passed (763)`.

Scenario oracle: each scenario is covered by a test titled with its case key (route tests `routes/api/cart/*.test.ts`, `lib/cart/*.test.ts`, `src/pages/cart.test.tsx`, `e2e/cart.spec.ts`), all part of the green runs above.

SCENARIO-VERDICT: Cart screen / Empty cart is displayed — pass (SWHR-C-0232)
SCENARIO-VERDICT: Cart screen / Cart with items is displayed — pass (SWHR-C-0233)
SCENARIO-VERDICT: Cart screen / Remove control is used — pass (SWHR-C-0234, e2e)
SCENARIO-VERDICT: Cart screen / Update Cart is submitted — pass (SWHR-C-0235, e2e)
SCENARIO-VERDICT: Cart screen / Check Out is used — pass (SWHR-C-0236, e2e)
SCENARIO-VERDICT: One cart per shopper session / First cart access in a session — pass (SWHR-C-0237)
SCENARIO-VERDICT: One cart per shopper session / Shopper signs out — pass (SWHR-C-0238; e2e SWHR-C-0135)
SCENARIO-VERDICT: One cart per shopper session / Two sessions do not share a cart — pass (SWHR-C-0239)
SCENARIO-VERDICT: Anonymous cart use / Anonymous shopper adds an item — pass (SWHR-C-0240; e2e SWHR-C-0130)
SCENARIO-VERDICT: Add item to cart / Item not yet in the cart — pass (SWHR-C-0241)
SCENARIO-VERDICT: Add item to cart / Item already in the cart — pass (SWHR-C-0242, resets to 1)
SCENARIO-VERDICT: Remove item from cart / Item in the cart is removed — pass (SWHR-C-0243)
SCENARIO-VERDICT: Remove item from cart / Item not in the cart is removed — pass (SWHR-C-0244)
SCENARIO-VERDICT: Batch quantity update / Positive quantity — pass (SWHR-C-0245)
SCENARIO-VERDICT: Batch quantity update / Zero or negative quantity — pass (SWHR-C-0246)
SCENARIO-VERDICT: Batch quantity update / Positive quantity for an item not in the cart — pass (SWHR-C-0247)
SCENARIO-VERDICT: Non-numeric quantity treated as zero / Letters entered as quantity — pass (SWHR-C-0248)
SCENARIO-VERDICT: Non-numeric quantity treated as zero / Decimal entered as quantity — pass (SWHR-C-0249)
SCENARIO-VERDICT: Cart item count / Count of a cart with multiple units — pass (SWHR-C-0250)
SCENARIO-VERDICT: Cart line contents / Line total — pass (SWHR-C-0251)
SCENARIO-VERDICT: Catalog resolution at read time / Catalog price changes after the item was added — pass (SWHR-C-0252)
SCENARIO-VERDICT: Unresolvable cart items / One item cannot be resolved — pass (SWHR-C-0253)
SCENARIO-VERDICT: Cart subtotal / Subtotal of several lines — pass (SWHR-C-0254)
SCENARIO-VERDICT: Cart subtotal / Subtotal of an empty cart — pass (SWHR-C-0255)
SCENARIO-VERDICT: Empty cart after order placement / Order placed — pass (SWHR-C-0256)

## Code Review

No code changes by Validation. Not a line-by-line review of merged tickets (reviewed per ticket). Design fidelity (advisory): mockups under `artifacts/SWHR-S-0010/design/` were not compared pixel-by-pixel; the empty and with-items screens are asserted by the page tests and e2e journey above.

## Coverage Summary

No coverage command is declared for this project and none was run. Coverage regression: not measured.

## Issues Found

None. No SPEC-GAP found.

## Recommendation

Pass: fire `validation.all_acs_passed`. Basis: the commands and outputs quoted above.
