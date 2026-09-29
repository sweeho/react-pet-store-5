# SWHR-T-0086 summary

Added `lib/account/scenarios/coverage.test.ts` (mirror of the sign-on coverage test for `swhr-i-0007-customer-account-and-profile`, archive-path aware, searching lib, routes, src, e2e). It passes: every approved case already has a named test, so no `*.scenarios.test.*` files were needed. Added the journeys "New shopper creates an account" and "Shopper views and edits their account" (city becomes San Jose) to `e2e/account.spec.ts`, and `e2e/personalisation.spec.ts`.

AC coverage: AC-1 coverage test; AC-2, AC-3 and AC-4 by the three Playwright journeys. Verification: `bun run verify` exit 0 (692 tests); the five account/personalisation specs pass in Chromium via a temporary config (see tdd-test-result.md).

Deviation: `e2e/account.spec.ts` already existed (SWHR-T-0083), so the new journeys are appended there rather than created.
