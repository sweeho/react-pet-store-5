---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0001
idea: SWHR-I-0002
branch: vortex/sprint/swhr-s-0001-144fcba5
upstream: [artifacts/SWHR-S-0001/SPRINT-PLAN.md, artifacts/SWHR-S-0001/qa-test-report.md]
---

# Sprint summary — SWHR-S-0001

## Tickets

| Ticket      | Type  | Title                                                                             | Outcome                                             |
| ----------- | ----- | --------------------------------------------------------------------------------- | --------------------------------------------------- |
| SWHR-T-0001 | TASK  | Sprint plan — SWHR-S-0001                                                         | DONE (`870195f`)                                    |
| SWHR-T-0002 | EPIC  | Bootstrap Pet Store: landing page and shared site shell                           | DONE (rollup)                                       |
| SWHR-T-0003 | STORY | A shopper lands on the Pet Store home page and every page shares one frame        | DONE (rollup)                                       |
| SWHR-T-0004 | TASK  | Boilerplate: Pet Store branding, Preline design tokens and root-route smoke test  | DONE (`abd37fa`, [summary](SWHR-T-0004/summary.md)) |
| SWHR-T-0005 | TASK  | Landing page: Pet Store home at '/' linking to every primary area                 | DONE (`3dc9401`, [summary](SWHR-T-0005/summary.md)) |
| SWHR-T-0006 | TASK  | Site shell: shared layout with header, Global navigation and footer on every page | DONE (`e299ef0`, [summary](SWHR-T-0006/summary.md)) |
| SWHR-T-0007 | TASK  | Shared frames: empty, error (with retry) and loading frames reused by every page  | DONE (`0f8c140`, [summary](SWHR-T-0007/summary.md)) |
| SWHR-T-0008 | TASK  | Integration QA report — SWHR-S-0001                                               | DONE (`9c08b01`)                                    |
| SWHR-T-0009 | TASK  | Sprint close bundle — SWHR-S-0001                                                 | this file                                           |

## What shipped

The sprint goal is met. SWHR-I-0002: the app is branded Pet Store and uses the Preline token set. `/` shows the Pet Store landing page, which links to every primary area. Every route renders inside one shell: a header, the `Global` navigation (which folds into a menu panel below `lg`) and a footer. The primary-area routes are placeholders built on the shared `EmptyState` frame. Unknown routes and render errors use the shared `ErrorState`, which offers **Try again** when the failure is retryable. The router's loading fallback is the shared `LoadingState`. `AsyncContent` is ready for the first capability that fetches data. All five `site-shell` scenarios pass (see Verification).

## Divergence from plan

The plan's four serial TASKs (T-0004 → T-0007) all shipped without changing a contract or an ownership map. There were two design-level choices, and both are recorded in the ticket summaries:

- The mockups show the Pets categories as a persistent `<aside>` sidebar. The fixed layout contract has no complementary landmark, so T-0006 surfaces the same categories as an inline "Pets" row on wide screens and inside the mobile panel instead.
- The language flags are non-navigating labels. The search box, Account, Cart and Sign in lead to placeholder pages. This matches the idea's stated non-scope.

## Verification

**PASS**, with no defects found and nothing fixed in place. The QA run covered 34/34 unit tests and 20/20 E2E tests, and all five scenario verdicts passed. See [`qa-test-report.md`](qa-test-report.md), [`integration-test-result.md`](integration-test-result.md) and [`integration-defects-resolution.md`](integration-defects-resolution.md).

## Defects Raised

None. `a2a_list_tickets(created_since=2026-09-28T15:00Z)` returns no DEFECT tickets for the sprint window.

## Retrospective

Judgment, not measured fact.

- **Went well:** The serial chain avoided file conflicts. T-0005 created `src/constants/navigation.ts` as the single list of areas, and T-0006 consumed it without rework.
- **Went well:** CI caught a real layout bug that the browser-free gate could not see. In T-0006, the headlessui `Dialog` root collapsed to 0×0, so the mobile panel counted as hidden. The fix landed before merge.
- **Could improve:** None of the three implementation containers could run E2E. The pre-installed Chromium (build 1223) does not match the pinned Playwright 1.50.1, which expects build 1155. E2E evidence therefore came only from CI and QA. QA had to download the matching browser (`bunx playwright install chromium`). Aligning the container image with the pinned Playwright version would give implementers their E2E feedback locally.
- **Could improve:** The mockups draw a Pets sidebar that the layout contract never mentions. The next plan that builds a category or listing screen should decide explicitly whether that sidebar belongs to the shell or to the page.

## Compliance / Control Evidence

| Control                        | Evidence                                           | Location                                                                                                       | Status       | Exception                                                                                 |
| ------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------- |
| Work planned before execution  | Change proposal, design, tasks; per-ticket PLAN.md | `openspec/changes/swhr-i-0002-bootstrap-landing-page-and-s/`, `artifacts/SWHR-S-0001/SWHR-T-000{4..7}/PLAN.md` | Satisfied    | —                                                                                         |
| Tests executed per ticket      | TDD red/green records                              | `artifacts/SWHR-S-0001/SWHR-T-000{4..7}/tdd-test-result.md`                                                    | Satisfied    | E2E was not run in the implementation containers (Chromium mismatch); it ran in CI and QA |
| Change verified before release | QA report, PASS verdict                            | `artifacts/SWHR-S-0001/qa-test-report.md`                                                                      | Satisfied    | —                                                                                         |
| Defects dispositioned          | 0 found                                            | `artifacts/SWHR-S-0001/integration-defects-resolution.md`                                                      | Satisfied    | —                                                                                         |
| Human acceptance of release    | —                                                  | Not Provided                                                                                                   | Not Provided | Landing on `dev` is automatic at SPRINT_CLOSE                                             |
