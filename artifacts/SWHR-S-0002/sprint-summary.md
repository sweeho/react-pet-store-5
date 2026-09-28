---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0002
idea: SWHR-I-0003
branch: vortex/sprint/swhr-s-0002-a6c70702
upstream:
  [
    artifacts/SWHR-S-0002/SPRINT-PLAN.md,
    artifacts/SWHR-S-0002/qa-test-report.md,
    artifacts/SWHR-S-0002/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0002/release-notes.md]
---

# Sprint summary — SWHR-S-0002

## Tickets

| Ticket      | Type  | Title                                                                                   | Outcome                                        |
| ----------- | ----- | --------------------------------------------------------------------------------------- | ---------------------------------------------- |
| SWHR-T-0010 | TASK  | Sprint plan — SWHR-S-0002                                                               | DONE (commit 239ee60)                          |
| SWHR-T-0011 | EPIC  | Localization — storefront in en_US, ja_JP and zh_CN                                     | DONE (rollup)                                  |
| SWHR-T-0012 | STORY | Shopper uses the store in their own language                                            | DONE (rollup)                                  |
| SWHR-T-0013 | TASK  | Locale model — supported locales, default and identifier parser                         | DONE (#9) — [summary](SWHR-T-0013/summary.md)  |
| SWHR-T-0014 | TASK  | Session locale — default assignment, change endpoint, cart locale                       | DONE (#11) — [summary](SWHR-T-0014/summary.md) |
| SWHR-T-0015 | TASK  | Orders and e-mails — order locale default, per-locale templates and price formats       | DONE (#10) — [summary](SWHR-T-0015/summary.md) |
| SWHR-T-0016 | TASK  | Forms, encoding and admin strings                                                       | DONE (#13) — [summary](SWHR-T-0016/summary.md) |
| SWHR-T-0017 | TASK  | Preferred language — applied at sign-on and profile save                                | DONE (#12) — [summary](SWHR-T-0017/summary.md) |
| SWHR-T-0018 | TASK  | Page localization — per-locale screen content, fallback, header language switch         | DONE (#14) — [summary](SWHR-T-0018/summary.md) |
| SWHR-T-0019 | TASK  | Catalog and prices — locale-keyed catalog, per-locale prices, product page, cart locale | DONE (#16) — [summary](SWHR-T-0019/summary.md) |
| SWHR-T-0020 | TASK  | Locale selection screen — choice list, Change Locale, confirmation                      | DONE (#15) — [summary](SWHR-T-0020/summary.md) |
| SWHR-T-0021 | TASK  | Integration QA report — SWHR-S-0002                                                     | DONE (#17), verdict PASS                       |
| SWHR-T-0022 | TASK  | Sprint close bundle — SWHR-S-0002                                                       | this file                                      |

## What shipped

Sprint goal "SWHR-I-0003: Localization" is met. The storefront now runs in en_US, ja_JP or zh_CN from one shared locale model. The server owns the session locale and cart locale, and the header, mobile drawer and `/locale` screen change it in place. Page copy falls back to en_US; catalog data and prices are keyed by locale and do not fall back. Order-locale defaulting, per-locale e-mail templates and prices, state/province options, the UTF-8 round-trip and the English/German admin catalogue are in place. All 23 requirements and 35 scenarios of change `swhr-i-0003-localization` pass (see Verification).

Several pieces are server seams that no screen uses yet, because the capabilities that would call them are later ideas: preferred-language apply (no sign-on or profile UI), the e-mail renderer (no send pipeline), `normaliseOrderLocale` (no order table, design SD-6) and `StateProvinceSelect` (no order form). Each is covered by tests at the seam.

## Divergence from plan

- **Navigation labels not localized.** The pet-category and area labels in the desktop category bar, mobile drawer and home "Shop by pet" grid stay English in every locale; the mockup shows them localized. The gap was raised during SWHR-T-0018 and added to SWHR-T-0019 as a comment-only scope addendum, but the ticket's acceptance criteria and PLAN.md were never updated, so it was not built and QA had no scenario to catch it. Filed as SWHR-T-0023.
- **SWHR-T-0020 widget.** The locale choice list is a radiogroup, matching `StateProvinceSelect` and the mockup, rather than the native `<select>` the plan named. No interface change.
- Otherwise delivered to plan. No ticket was added, split or dropped.

## Verification

PASS. Lint, typecheck and 151 unit tests pass, all 28 E2E tests pass, and all 35 scenarios pass. No defects were found in integration. See [qa-test-report.md](qa-test-report.md), [integration-test-result.md](integration-test-result.md) and [integration-defects-resolution.md](integration-defects-resolution.md).

## Defects Raised

| Ticket      | Description                                                             | Filed by                                                                      | Status  |
| ----------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------- |
| SWHR-T-0023 | Pet-category and area navigation labels stay English in ja_JP and zh_CN | planning (at close; originally raised by implementation-3 during SWHR-T-0018) | BACKLOG |

## Retrospective

- **Went well:** building SWHR-T-0013 first, with the shared parser and default as a fixed contract, let four tickets run in parallel with no rework. The session seam from SWHR-T-0014 was reused unchanged by SWHR-T-0017, SWHR-T-0018 and SWHR-T-0019.
- **Went well:** CI's E2E run on SWHR-T-0019 caught a real seed-data collision (two items at the same $18.50 broke a strict locator) before merge.
- **Could improve:** a scope change must go into a ticket's acceptance criteria, not only a comment. The navigation-label addendum on SWHR-T-0019 lived only as a comment and was lost. Planning owns this miss.
- **Could improve:** four implementation containers (SWHR-T-0014, 0015, 0016, 0020) had no Chromium, so each E2E spec first ran in CI or at QA. At QA the container's Chromium build also didn't match the one `@playwright/test` expects. Pinning the browser build in the agent image would move E2E feedback back to the ticket.

## Compliance / Control Evidence

| Control                        | Evidence                                                    | Location                                                                                 | Status    | Exception                                                         |
| ------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------- |
| Work planned before execution  | Change proposal, design, specs, tasks; per-ticket PLAN.md   | `openspec/changes/swhr-i-0003-localization/`, `artifacts/SWHR-S-0002/SWHR-T-00*/PLAN.md` | Satisfied | —                                                                 |
| Tests executed per ticket      | TDD results                                                 | `artifacts/SWHR-S-0002/SWHR-T-00{13..20}/tdd-test-result.md`                             | Satisfied | E2E for T-0014/15/16/20 ran in CI/QA, not in the ticket container |
| Change verified before release | QA report, PASS, 35/35 scenarios                            | `artifacts/SWHR-S-0002/qa-test-report.md`                                                | Satisfied | —                                                                 |
| Defects dispositioned          | 0 integration defects; 1 post-QA defect filed to backlog    | `integration-defects-resolution.md`; SWHR-T-0023                                         | Satisfied | SWHR-T-0023 open, not a spec-scenario failure                     |
| Release approval               | Sprint reached SPRINT_CLOSE via `validation.all_acs_passed` | SWHR-T-0021                                                                              | Satisfied | Human approver: Not Provided                                      |
