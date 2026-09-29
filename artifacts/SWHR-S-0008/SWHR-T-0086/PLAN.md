# SWHR-T-0086 — Scenario coverage and end-to-end account journeys

Change `swhr-i-0007-customer-account-and-profile`, tasks.md group 7. Read `openspec/changes/swhr-i-0007-customer-account-and-profile/design.md` §Sprint planning → Phases 7 and 8 first. Depends on SWHR-T-0084 (last of the implementing chain).

## Objective

Every approved test case in the change's `test-cases.md` is backed by a named test, and a test enforces that. The three shopper journeys pass in a real browser. Items 7.1–7.5 are met by the tests SWHR-T-0081 … SWHR-T-0084 wrote; this ticket closes the gaps the coverage test finds.

## Design reference

The journeys walk the screens in `artifacts/SWHR-S-0008/design/` (MANIFEST.md); assert on visible text, not layout.

## Steps

1. `lib/account/scenarios/coverage.test.ts` (new): copy `lib/auth/scenarios/coverage.test.ts`, set `CHANGE_ID = "swhr-i-0007-customer-account-and-profile"`, keep the archive-path lookup (the change directory moves at sprint close), search `lib`, `routes`, `src`, `e2e`.
2. For each approved case the coverage test reports as missing, add the test in a NEW file next to the module (e.g. `lib/account/customer.scenarios.test.ts`). Do not edit test files other tickets own.
3. `e2e/account.spec.ts` (new): "New shopper creates an account" and "Shopper views and edits their account".
4. `e2e/personalisation.spec.ts` (new): My List and fish banner on home with preferences on; both gone after turning them off in the edit form.
5. Run every new spec at least once before committing.

## File/module ownership

- `lib/account/scenarios/coverage.test.ts` — new
- `e2e/account.spec.ts`, `e2e/personalisation.spec.ts` — new
- new `*.scenarios.test.ts` / `*.scenarios.test.tsx` files only, where coverage is missing

## Definition of Done

AC-1 … AC-4 on the ticket.
