---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0004
idea: SWHR-I-0005
branch: vortex/sprint/swhr-s-0004-cb2d4596
upstream:
  [
    artifacts/SWHR-S-0004/SPRINT-PLAN.md,
    openspec/changes/swhr-i-0005-sign-on-and-access-control/specs/sign-on/spec.md,
  ]
downstream: [artifacts/SWHR-S-0004/sprint-summary.md]
---

# QA test report — SWHR-S-0004

## Executive Summary

**Verdict: PASS.** SWHR-I-0005 (sign-on and access control) holds on the integrated sprint
branch. All 49 approved test cases (`SWHR-C-0099`–`SWHR-C-0147`) covering the 49 scenarios of
the `sign-on` delta spec pass, verified by an executed run — not by inspection: `bun run verify`
(lint + typecheck + 494 unit/integration tests across 112 files) and the full Playwright suite
(36/36, including all 8 sign-on e2e journeys) both ran clean on this branch after `bun install`
and `bun run build`. No defects were found; `integration-defects-resolution.md` is empty.
Storefront credentials, the protected-page gate, two-step registration, sign-out, idle timeouts,
and the separate administrator/supplier realms (role guard, login-error/timeout pages, the
session-bound admin launch descriptor, and the supplier not-authorised gate) all behave per
spec. Two provisional decisions recorded in `design.md` remain open and are not blockers for
this sprint: OQ-1 (password maximum defaults to a configurable 25, SWHR-T-0049) and OQ-6 (the
admin "client launch" is a JSON descriptor, no rich client).

## E2E Test Status

Full Playwright suite executed: **36 passed, 0 failed, 0 skipped**, including all 8
`e2e/sign-on.spec.ts` journeys (SWHR-C-0103, 0106, 0117, 0130, 0132, 0134, 0135, 0140). See
`artifacts/SWHR-S-0004/integration-test-result.md` for the exact command, Playwright's verbatim
summary, and the per-spec table. `E2E-RESULT: chromium 36 passed, 0 failed, 0 skipped`.

## Unit Test Results

```
$ bun install
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  112 passed (112)
      Tests  494 passed (494)
   Duration  15.22s
```

Lint and typecheck are clean (zero warnings, `--max-warnings 0`). Includes
`lib/auth/scenarios/coverage.test.ts` (P14 self-check), which asserts every approved
`SWHR-C-*` id in `test-cases.md` is named by at least one test under `lib/`, `routes/`,
`middleware/`, `src/` or `e2e/` — this passed, so no approved case is silently uncovered.

## Code Review

No notable concerns observed. `lib/auth/credentials.ts` and `lib/auth/session.ts` match the
`design.md` interface contracts exactly (`USER_ID_MAX_LENGTH`, `getPasswordMaxLength`,
`IDLE_TIMEOUT_MS`). Passwords are hashed with `Bun.password` (argon2id) and never logged, per
`design.md` OQ-2. `src/pages/signin.tsx` implements `SWHR-R-0053`'s two-form layout matching
`artifacts/SWHR-S-0004/design/mockup-sign-in-no-remembered-user-name-demo-cre.html` (same
headings, labels and buttons), deliberately omitting the mockup's demo-credential pre-fill —
this is `design.md` SD-5/OQ-8, not a defect.

## Coverage Summary

No coverage-tool dependency (`@vitest/coverage-*`) is installed in this project, so no line/branch
percentage was measured — none is invented here. Coverage is evidenced instead by the P14
approved-case audit: `lib/auth/scenarios/coverage.test.ts` mechanically checks that all 49
approved `SWHR-C-*` cases are named by a real test, and this report's scenario verdicts below
independently confirm each of the 49 spec scenarios against that same set.

## Issues Found

None. `artifacts/SWHR-S-0004/integration-defects-resolution.md` is COMPLETE with an empty
defect table.

## Recommendation

**Proceed — fire `validation.all_acs_passed`.** Every acceptance criterion and every spec
scenario passed on an executed run; no defects were found or fixed.

### Scenario verdicts — `sign-on` delta spec

SCENARIO-VERDICT: Sign-in screen / A remembered user name is present — pass (SWHR-C-0099)
SCENARIO-VERDICT: Sign-in screen / No remembered user name — pass (SWHR-C-0100)
SCENARIO-VERDICT: Sign-in screen / Returning-customer form submitted with an empty field — pass (SWHR-C-0101)
SCENARIO-VERDICT: Sign-in screen / Create New Account activated — pass (SWHR-C-0102)
SCENARIO-VERDICT: Sign-in error screen / Unknown credentials submitted — pass (SWHR-C-0103)
SCENARIO-VERDICT: Storefront page header / Anonymous shopper views a page — pass (SWHR-C-0104)
SCENARIO-VERDICT: Storefront page header / Signed-on shopper views a page — pass (SWHR-C-0105)
SCENARIO-VERDICT: Storefront page header / Keyword search from the header — pass (SWHR-C-0106)
SCENARIO-VERDICT: Sign-on credential record / Credential created — pass (SWHR-C-0107)
SCENARIO-VERDICT: Unique user id / Duplicate user id — pass (SWHR-C-0108)
SCENARIO-VERDICT: User id length limit / 26-character user id — pass (SWHR-C-0109)
SCENARIO-VERDICT: User id length limit / 25-character user id — pass (SWHR-C-0110)
SCENARIO-VERDICT: User id wildcard characters forbidden / User id containing a percent sign — pass (SWHR-C-0111)
SCENARIO-VERDICT: User id wildcard characters forbidden / User id containing an asterisk — pass (SWHR-C-0112)
SCENARIO-VERDICT: Password length limit / Password over the maximum — pass (SWHR-C-0113)
SCENARIO-VERDICT: Credential authentication / Correct password — pass (SWHR-C-0114)
SCENARIO-VERDICT: Credential authentication / Password differs only in case — pass (SWHR-C-0115)
SCENARIO-VERDICT: Credential authentication / Unknown user id — pass (SWHR-C-0116)
SCENARIO-VERDICT: Sign-on submission and return to the requested page / Valid credentials after being gated — pass (SWHR-C-0117)
SCENARIO-VERDICT: Sign-on submission and return to the requested page / Invalid credentials — pass (SWHR-C-0118)
SCENARIO-VERDICT: Remember user name / Remember selected — pass (SWHR-C-0119)
SCENARIO-VERDICT: Remember user name / Remember not selected — pass (SWHR-C-0120)
SCENARIO-VERDICT: Protected storefront pages / Anonymous shopper opens checkout — pass (SWHR-C-0121)
SCENARIO-VERDICT: Protected storefront pages / Anonymous shopper opens the cart — pass (SWHR-C-0122)
SCENARIO-VERDICT: Protected-page gate / Signed-on user requests a protected page — pass (SWHR-C-0123)
SCENARIO-VERDICT: Protected-page gate / Gated request is remembered — pass (SWHR-C-0124)
SCENARIO-VERDICT: Exact protected-path matching / Query string ignored — pass (SWHR-C-0125)
SCENARIO-VERDICT: Exact protected-path matching / Similar path not matched — pass (SWHR-C-0126)
SCENARIO-VERDICT: Configurable sign-on protection / Duplicate protected-page name — pass (SWHR-C-0127)
SCENARIO-VERDICT: Storefront protection ignores configured roles / Role configured on a protected page — pass (SWHR-C-0128)
SCENARIO-VERDICT: Anonymous access to sign-on services / Anonymous account creation — pass (SWHR-C-0129)
SCENARIO-VERDICT: Anonymous catalog and cart access / Anonymous shopper adds to cart — pass (SWHR-C-0130)
SCENARIO-VERDICT: Data-layer access enforced by callers / Internal caller reads a purchase order — pass (SWHR-C-0131)
SCENARIO-VERDICT: Two-step customer registration / Registration started from checkout — pass (SWHR-C-0132)
SCENARIO-VERDICT: Two-step customer registration / Registration started from account change — pass (SWHR-C-0133)
SCENARIO-VERDICT: Two-step customer registration / Sign-up chosen on the sign-in screen — pass (SWHR-C-0134)
SCENARIO-VERDICT: Storefront sign-out / Sign out with items in the cart — pass (SWHR-C-0135)
SCENARIO-VERDICT: Storefront session idle timeout / Idle beyond 15 minutes — pass (SWHR-C-0136, SWHR-C-0137)
SCENARIO-VERDICT: Administration console restricted to administrators / Unauthenticated request for the console — pass (SWHR-C-0138)
SCENARIO-VERDICT: Administration console restricted to administrators / Authenticated non-administrator — pass (SWHR-C-0139)
SCENARIO-VERDICT: Administrator role assignment / Member of the administrator group — pass (SWHR-C-0140)
SCENARIO-VERDICT: Administrative sign-in failure / Wrong administrator password — pass (SWHR-C-0141)
SCENARIO-VERDICT: Administrator sign-out / Administrator signs out — pass (SWHR-C-0142)
SCENARIO-VERDICT: Administrator session idle timeout / Idle administrator — pass (SWHR-C-0143)
SCENARIO-VERDICT: Administration data service requires a session / Expired session calls the data service — pass (SWHR-C-0144)
SCENARIO-VERDICT: Session-bound administration client launch / Client launched from the console — pass (SWHR-C-0145)
SCENARIO-VERDICT: Supplier inventory restricted to administrators / Supplier user without the role — pass (SWHR-C-0146)
SCENARIO-VERDICT: Supplier sign-out / Supplier logs out — pass (SWHR-C-0147)
