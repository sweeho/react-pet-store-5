---
artifact: qa-test-report
sprint: SWHR-S-0012
ticket: SWHR-T-0126
author: validation
---

# QA test report — SWHR-S-0012 (SWHR-I-0010 Order approval)

## Executive Summary

All 53 scenarios of change `swhr-i-0010-order-approval` pass. Lint, typecheck, build, unit (899/899) and Playwright E2E (69/69, 0 skipped) all ran green on the integrated sprint branch. No defects found. Design fidelity was not compared against the mockups (advisory only).

## E2E Test Status

`bun run test:e2e` → `69 passed (25.3s)`, exit 0, no skips. 5 tests in `e2e/order-approval.spec.ts` cover launch, logout, uncommitted-close, commit-then-refresh and sales bar chart. Details: `integration-test-result.md`.

## Unit Test Results

`bun run test` → `Test Files  176 passed (176)`, `Tests  899 passed (899)`, exit 0. Also `bun run lint`, `bun run typecheck` and `bun run build` each exit 0.

## Code Review

Not a re-review of merged tickets. Verified by inspection that each scenario has a citing test titled with its SWHR-C key (intake, approvalPolicy, approval, orderApproval document, admin order-data route, SalesCharts/orderData, orders/console pages). This ticket changed no code.

## Coverage Summary

No coverage tool is declared in the project commands and none was run; no percentage is claimed. Scenario coverage: every delta-spec scenario has at least one executed test (verdicts below).

## Issues Found

None. No SPEC-GAPs identified.

SCENARIO-VERDICT: Automatic approval threshold / Small US order is auto-approved — pass (evidence: SWHR-C-0287)
SCENARIO-VERDICT: Automatic approval threshold / US order at the threshold is not auto-approved — pass (evidence: SWHR-C-0288)
SCENARIO-VERDICT: Automatic approval threshold / Small Japanese order is auto-approved — pass (evidence: SWHR-C-0289)
SCENARIO-VERDICT: Automatic approval threshold / Japanese order at the threshold is not auto-approved — pass (evidence: SWHR-C-0290)
SCENARIO-VERDICT: Orders in other locales await review / Chinese-locale order of any value — pass (evidence: SWHR-C-0291)
SCENARIO-VERDICT: Order summary for administrator review / Order summary fields — pass (evidence: SWHR-C-0292)
SCENARIO-VERDICT: Order summary for administrator review / Unrecognised status value — pass (evidence: SWHR-C-0293)
SCENARIO-VERDICT: List orders by status / Pending orders requested — pass (evidence: SWHR-C-0294)
SCENARIO-VERDICT: List orders by status / No orders in the status — pass (evidence: SWHR-C-0295)
SCENARIO-VERDICT: List orders by status / Order details missing — pass (evidence: SWHR-C-0296)
SCENARIO-VERDICT: Order data loaded on start and refresh / Client start — pass (evidence: SWHR-C-0297)
SCENARIO-VERDICT: Decisions take effect only on commit / Mixed commit — pass (evidence: SWHR-C-0298)
SCENARIO-VERDICT: Decisions take effect only on commit / Commit with no changes — pass (evidence: SWHR-C-0299)
SCENARIO-VERDICT: Decisions take effect only on commit / Uncommitted changes are not applied — pass (evidence: SWHR-C-0300 (e2e))
SCENARIO-VERDICT: Asynchronous delivery of approval decisions / Decisions queued — pass (evidence: SWHR-C-0301)
SCENARIO-VERDICT: Asynchronous delivery of approval decisions / Entry missing an identifier — pass (evidence: SWHR-C-0302)
SCENARIO-VERDICT: Approval document structure / Wrong root — pass (evidence: SWHR-C-0303)
SCENARIO-VERDICT: Approval document structure / Empty batch — pass (evidence: SWHR-C-0304)
SCENARIO-VERDICT: Approval document structure / Order missing its status — pass (evidence: SWHR-C-0305)
SCENARIO-VERDICT: Decisions apply only to pending orders / Duplicate decision — pass (evidence: SWHR-C-0306)
SCENARIO-VERDICT: Applying an approval decision / Approval batch processed — pass (evidence: SWHR-C-0307)
SCENARIO-VERDICT: Applying an approval decision / Automatic approval — pass (evidence: SWHR-C-0308)
SCENARIO-VERDICT: Warning on refresh with uncommitted changes / Refresh cancelled — pass (evidence: SWHR-C-0309)
SCENARIO-VERDICT: Warning on refresh with uncommitted changes / Refresh confirmed — pass (evidence: SWHR-C-0310)
SCENARIO-VERDICT: Busy state during server requests / Commit in progress — pass (evidence: SWHR-C-0311)
SCENARIO-VERDICT: Server failure in the administrator client / Server unreachable — pass (evidence: SWHR-C-0312)
SCENARIO-VERDICT: Invalid administrator data requests / Unknown request type — pass (evidence: SWHR-C-0313)
SCENARIO-VERDICT: Invalid administrator data requests / Malformed request — pass (evidence: SWHR-C-0314)
SCENARIO-VERDICT: Sales revenue report / Revenue by category — pass (evidence: SWHR-C-0315)
SCENARIO-VERDICT: Sales revenue report / Revenue within one category — pass (evidence: SWHR-C-0316)
SCENARIO-VERDICT: Order-count report / Quantities by category — pass (evidence: SWHR-C-0317)
SCENARIO-VERDICT: Report window and status coverage / Order on the boundary — pass (evidence: SWHR-C-0318)
SCENARIO-VERDICT: Report window and status coverage / Denied order in the window — pass (evidence: SWHR-C-0319)
SCENARIO-VERDICT: Report date entry validation / Invalid date entered — pass (evidence: SWHR-C-0320)
SCENARIO-VERDICT: Default report date range / First display of the sales charts — pass (evidence: SWHR-C-0321)
SCENARIO-VERDICT: Invalid report groups omitted / Group without a name — pass (evidence: SWHR-C-0322)
SCENARIO-VERDICT: Administrator landing page / Landing page displayed — pass (evidence: SWHR-C-0323)
SCENARIO-VERDICT: Administrator landing page / Launch control used — pass (evidence: SWHR-C-0324 (e2e))
SCENARIO-VERDICT: Administrator landing page / Logout control used — pass (evidence: SWHR-C-0325 (e2e))
SCENARIO-VERDICT: Order-management client workspace / Workspace opened — pass (evidence: SWHR-C-0326)
SCENARIO-VERDICT: Order-management client workspace / Committed change visible after refresh — pass (evidence: SWHR-C-0327 (e2e))
SCENARIO-VERDICT: Process Pending Orders display / Pending orders listed — pass (evidence: SWHR-C-0328)
SCENARIO-VERDICT: Process Pending Orders display / Sort by amount — pass (evidence: SWHR-C-0329)
SCENARIO-VERDICT: Process Pending Orders display / No pending orders — pass (evidence: SWHR-C-0330)
SCENARIO-VERDICT: Process Pending Orders decisions / Bulk approve — pass (evidence: SWHR-C-0331)
SCENARIO-VERDICT: Process Pending Orders decisions / Single-row edit — pass (evidence: SWHR-C-0332)
SCENARIO-VERDICT: Process Pending Orders decisions / Read-only fields — pass (evidence: SWHR-C-0333)
SCENARIO-VERDICT: Process Pending Orders decisions / Commit — pass (evidence: SWHR-C-0334)
SCENARIO-VERDICT: View Non-Pending Orders display / Non-pending orders listed — pass (evidence: SWHR-C-0335)
SCENARIO-VERDICT: View Non-Pending Orders display / Editing refused — pass (evidence: SWHR-C-0336)
SCENARIO-VERDICT: Sales charts view / Pie chart percentages — pass (evidence: SWHR-C-0337)
SCENARIO-VERDICT: Sales charts view / New range requested — pass (evidence: SWHR-C-0338 (+ e2e bar chart reload))
SCENARIO-VERDICT: Order row date and amount display / Date shown without padding — pass (evidence: SWHR-C-0339)

## Recommendation

Approve: all scenarios pass and the automated gates are green on the integrated branch, as shown by the runs above. Staging was not exercised separately beyond the Playwright-served build.
