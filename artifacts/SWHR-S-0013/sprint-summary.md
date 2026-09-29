---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0013
idea: none
branch: vortex/sprint/swhr-s-0013-b484a233
upstream:
  [
    artifacts/SWHR-S-0013/SPRINT-PLAN.md,
    artifacts/SWHR-S-0013/qa-test-report.md,
    artifacts/SWHR-S-0013/integration-test-result.md,
    artifacts/SWHR-S-0013/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0013/release-notes.md]
---

# Sprint summary — SWHR-S-0013

## Tickets

| Ticket      | Type   | Title                                                                             | Outcome                                          |
| ----------- | ------ | --------------------------------------------------------------------------------- | ------------------------------------------------ |
| SWHR-T-0128 | TASK   | Bugfix plan — SWHR-S-0013                                                         | DONE                                             |
| SWHR-T-0125 | DEFECT | Checkout with blank e-mail leaves order stuck: order-intake rejects empty EmailId | DONE (#91) — [fix note](SWHR-T-0125/fix-note.md) |
| SWHR-T-0129 | TASK   | Integration QA report — SWHR-S-0013                                               | DONE (#93), verdict PASS                         |
| SWHR-T-0130 | TASK   | Sprint close bundle — SWHR-S-0013                                                 | this file                                        |

## What shipped

The sprint goal is met: a checkout with no contact e-mail is refused instead of being confirmed and then lost. Change `swhr-s-0013-bugfix-swhr-t-0125-checkout` adds regression scenario "No contact e-mail anywhere" to checkout requirement SWHR-R-0147. The scenario merges into `openspec/specs/checkout/` at close.

- **Guard at placement.** `placeOrder` resolves the order e-mail from the billing e-mail, falling back to the account's e-mail. When the result is blank, it throws `MissingFormDataFailure(["billing.email"])` before the transaction. The response is 400 with screen `/error`, no order id is used, nothing is queued and the cart is kept. (SWHR-T-0125)
- **Tests.** `routes/api/orders/index.test.ts` adds SWHR-C-0460 and an account-e-mail fallback case. `e2e/checkout.spec.ts` SWHR-C-0265 now fills the billing e-mail, because its account has none and the test had passed only because of the defect. (SWHR-T-0125)

## Divergence from plan

None. The fix touched exactly the three files in the ownership map and followed design D1–D4. The only addition is that the route test's `signIn` helper takes an optional account e-mail so it can set up both cases.

## Verification

The verdict is PASS. All 3 delta scenarios pass. Lint, typecheck, build and 823 unit tests are green, and Chromium E2E passed 64 of 64 with none skipped. SWHR-T-0125 recorded a platform red run in which SWHR-C-0460 failed with status 200 before the fix, then a green run after it. No integration defects were found. See [qa-test-report.md](qa-test-report.md), [integration-test-result.md](integration-test-result.md) and [integration-defects-resolution.md](integration-defects-resolution.md).

## Root docs

No root doc changed. PRODUCT.md needed no update, because no capability was added and scope is the same. ARCHITECTURE.md needed none either, since topology, data model, integrations and decisions are unchanged. DESIGN.md has no design-system change: no screen or token changed. AGENTS.md is human-authored and was not touched. No Changelog entry was added: no doc changed, and the planning role forbids new entries.

## Open items

The sprint was not conditionally approved, so there is no Known Issues section. These items stay open after close, as recorded in the change's `proposal.md` §Follow-ups:

- **F1: stranded orders.** Orders placed before this fix with no e-mail remain as `dead` `opc.purchase-order` deliveries, and their shoppers saw a confirmation. Repairing them is an operational data task and is not filed.
- **F2: E2E helper has no e-mail.** `completeAccountForm` in `e2e/account-helpers.ts` fills no e-mail, so each checkout journey has to fill the billing e-mail itself. It is best changed after SWHR-S-0012 has landed on `dev`, because that sprint edits the same helper. Not filed.
- **No browser journey for the refusal.** The blank-e-mail path is covered at route level only. QA noted that no E2E test shows the general error screen for it.
- **Carried items** from SWHR-S-0011 (SD-1, SD-9 and SWHR-T-0103) remain as recorded there.

## Defects Raised

None. No DEFECT ticket was created between the sprint start (2026-09-29T21:00Z) and close.

## Retrospective

- **Went well:** the defect was reproduced at planning with a ten-line script before any code changed. The platform red run then failed on the exact assertion the regression scenario predicts.
- **Went well:** the ownership map avoided every file that the still-landing SWHR-S-0012 edits, so the two sprints cannot conflict.
- **Could improve:** SWHR-C-0265 passed only because of the defect. Its account had no e-mail, and no test asserted that the placed order was actually stored. A checkout E2E should check the order reaches intake, not only that the confirmation page appears.
- **Could improve:** the defect report said the message was "retried forever". It is retried until `OUTBOX_MAX_ATTEMPTS` and then marked dead. Triage should check the dispatcher's retry limit before describing the impact.

## Compliance / Control Evidence

| Control                        | Evidence                                                    | Location                                                                                               | Status    | Exception                    |
| ------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------- | ---------------------------- |
| Work planned before execution  | Change proposal, design, spec delta, tasks; PLAN.md         | `openspec/changes/swhr-s-0013-bugfix-swhr-t-0125-checkout/` (archived at close), `SWHR-T-0125/PLAN.md` | Satisfied | —                            |
| Tests executed per ticket      | Platform red and green runs                                 | `artifacts/SWHR-S-0013/SWHR-T-0125/tdd-test-result.md`                                                 | Satisfied | —                            |
| Change verified before release | QA report, PASS, 3/3 scenarios, 64/64 E2E                   | `artifacts/SWHR-S-0013/qa-test-report.md`                                                              | Satisfied | —                            |
| Defects dispositioned          | SWHR-T-0125 fixed; 0 integration defects, 0 raised          | `artifacts/SWHR-S-0013/integration-defects-resolution.md`                                              | Satisfied | —                            |
| Release approval               | Sprint reached SPRINT_CLOSE via `validation.all_acs_passed` | SWHR-T-0129                                                                                            | Satisfied | Human approver: Not Provided |
