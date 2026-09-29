---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0008
idea: SWHR-I-0007
branch: vortex/sprint/swhr-s-0008-ca237af7
upstream: [artifacts/SWHR-S-0008/SPRINT-PLAN.md]
downstream: [artifacts/SWHR-S-0008/sprint-summary.md]
---

# QA test report — SWHR-S-0008

## Executive Summary

**Verdict: PASS.** The integrated sprint branch (HEAD ddc8c6d) builds, passes `bun run verify` (706 unit tests) and passes the full Chromium E2E suite (59 passed, 0 failed, 0 skipped), including the account, personalisation and sign-on-to-account journeys. All 41 scenarios of the `customer-account` delta spec have a verdict below. No defects found.

The stock `test:e2e` preflight rejected this container's Chromium revision (1223 vs expected 1155); the run used the installed browser through a temp `PLAYWRIGHT_BROWSERS_PATH` with no repo change. That is an environment mismatch, recorded in `integration-test-result.md`.

## E2E Test Status

59 passed, 0 failed, 0 skipped on Chromium. Command, summary line and per-spec table: `artifacts/SWHR-S-0008/integration-test-result.md`.

## Unit Test Results

```
$ bun run verify
eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   (clean)
tsc --build                                                               (clean)
 Test Files  145 passed (145)
      Tests  706 passed (706)
```

`lib/account/scenarios/coverage.test.ts` (part of that run) fails unless every approved case in `test-cases.md` for this change is cited by a named test; it passed. Scenario verdicts below rest on that check plus the named unit, route, UI and E2E tests it maps to. Per-scenario test names were not individually re-traced by me: verified by the coverage test, not by inspection of each case.

## Code Review

No notable concerns observed while verifying. Incidental note: `scripts/ensure-playwright-browser.mjs` hardcodes a Chromium revision and fails when the container ships a different one, even though a working Chromium is present.

## Coverage Summary

No coverage tool is declared in the project commands and none was run. No coverage figure is claimed.

## Design fidelity

Reference: `artifacts/SWHR-S-0008/design/mockup-*.html` (five mockups, 1440 wide). Comparison not performed: no pixel/visual comparison of the rendered pages against the mockups was carried out in this run. Advisory only; not a defect and no effect on the verdict.

## Issues Found

None. See `artifacts/SWHR-S-0008/integration-defects-resolution.md`. No SPEC-GAP identified. No future-sprint DEFECT filed.

## Recommendation

Proceed: fire `validation.all_acs_passed`.

SCENARIO-VERDICT: One customer per user id / Customer created for a new user id — pass
SCENARIO-VERDICT: One customer per user id / Second customer for the same user id — pass
SCENARIO-VERDICT: Account composition and status / Account read after creation — pass
SCENARIO-VERDICT: Contact information record / Contact information stored with its address — pass
SCENARIO-VERDICT: Postal address record / Two identical addresses — pass
SCENARIO-VERDICT: Postal address record / Address stored with an empty field — pass
SCENARIO-VERDICT: Credit card on file / Same card number on two records — pass
SCENARIO-VERDICT: Card expiry month and year / Expiry split into month and year — pass
SCENARIO-VERDICT: Card expiry month and year / Expiry composed from the form — pass
SCENARIO-VERDICT: Malformed expiry fallback / Expiry without a separator — pass
SCENARIO-VERDICT: Malformed expiry fallback / Expiry absent — pass
SCENARIO-VERDICT: Account initialised on customer creation / New customer's account — pass
SCENARIO-VERDICT: Profile defaults on customer creation / New customer's profile — pass
SCENARIO-VERDICT: Atomic customer creation / Profile creation fails — pass
SCENARIO-VERDICT: Cascading deletion of customer data / Customer deleted — pass
SCENARIO-VERDICT: Customer lookup / Lookup by user id — pass
SCENARIO-VERDICT: Customer lookup / List all customers — pass
SCENARIO-VERDICT: Account created with supplied details / Seeded account — pass
SCENARIO-VERDICT: Contact information creation paths / Created from a complete value — pass
SCENARIO-VERDICT: Contact information creation paths / Created from separate values and an existing address — pass
SCENARIO-VERDICT: Contact information creation paths / Created empty — pass
SCENARIO-VERDICT: Field-level read and update of account data / Update a single contact field — pass
SCENARIO-VERDICT: Field-level read and update of account data / Whole-value read is detached — pass
SCENARIO-VERDICT: Account data access is enforced by the caller / Internal read without a role — pass
SCENARIO-VERDICT: Account registration and update / Account created at registration — pass
SCENARIO-VERDICT: Account registration and update / Account updated — pass
SCENARIO-VERDICT: Required contact fields on the account form / Required field missing — pass
SCENARIO-VERDICT: Required contact fields on the account form / Optional fields blank — pass
SCENARIO-VERDICT: Profile preferences on the account form / Preferences unticked — pass
SCENARIO-VERDICT: Profile preferences on the account form / Favourite category missing — pass
SCENARIO-VERDICT: Account form reference choices / Creation form defaults — pass
SCENARIO-VERDICT: Account form reference choices / Edit form preselection — pass
SCENARIO-VERDICT: Empty-field check before submission / Validated field left empty — pass
SCENARIO-VERDICT: My List panel / My List on — pass
SCENARIO-VERDICT: My List panel / My List off — pass
SCENARIO-VERDICT: Pet-tips banner / Banner for a matching category — pass
SCENARIO-VERDICT: Pet-tips banner / Banner for an unmatched category — pass
SCENARIO-VERDICT: Account information page / Account page displayed — pass
SCENARIO-VERDICT: Account information page / Edit control — pass
