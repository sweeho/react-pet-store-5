---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0012
idea: SWHR-I-0010
branch: vortex/sprint/swhr-s-0012-057cab7b
upstream:
  [
    artifacts/SWHR-S-0012/SPRINT-PLAN.md,
    artifacts/SWHR-S-0012/qa-test-report.md,
    artifacts/SWHR-S-0012/integration-test-result.md,
    artifacts/SWHR-S-0012/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0012/release-notes.md]
---

# Sprint summary — SWHR-S-0012

## Tickets

| Ticket      | Type  | Title                                                                                                  | Outcome                                        |
| ----------- | ----- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| SWHR-T-0116 | TASK  | Sprint plan — SWHR-S-0012                                                                              | DONE                                           |
| SWHR-T-0117 | EPIC  | Order approval                                                                                         | DONE (rollup)                                  |
| SWHR-T-0118 | STORY | Orders are approved automatically or by an administrator, and the administrator sees sales by category | DONE (rollup)                                  |
| SWHR-T-0119 | TASK  | Order-approval data model: approval document, decision and notice channels, per-locale thresholds      | DONE (#83) — [summary](SWHR-T-0119/summary.md) |
| SWHR-T-0122 | TASK  | Administrator order-data service: POST /api/admin/order-data                                           | DONE (#84) — [summary](SWHR-T-0122/summary.md) |
| SWHR-T-0121 | TASK  | Decision processing: order-approval consumer applies decisions to PENDING orders                       | DONE (#85) — [summary](SWHR-T-0121/summary.md) |
| SWHR-T-0120 | TASK  | Automatic approval on order intake: strict per-locale thresholds                                       | DONE (#86) — [summary](SWHR-T-0120/summary.md) |
| SWHR-T-0123 | TASK  | Administrator screens: landing page, workspace, order tables, sales charts, busy/warning/fatal states  | DONE (#87) — [summary](SWHR-T-0123/summary.md) |
| SWHR-T-0124 | TASK  | End-to-end order approval: Playwright journeys                                                         | DONE (#88) — [summary](SWHR-T-0124/summary.md) |
| SWHR-T-0126 | TASK  | Integration QA report — SWHR-S-0012                                                                    | DONE (#90), verdict PASS                       |
| SWHR-T-0127 | TASK  | Sprint close bundle — SWHR-S-0012                                                                      | this file                                      |

## What shipped

The sprint goal "SWHR-I-0010: Order approval" is met. Change `swhr-i-0010-order-approval` adds the `order-approval` capability; its scenarios merge into `openspec/specs/` at close.

- **Data model.** `AUTO_APPROVAL_THRESHOLDS` in `lib/orders/approvalPolicy.ts` (en_US 500.00, ja_JP 50000, zh_CN none). The `OrderApproval` document writer and an always-strict reader with its bundled DTD/XSD. Outbox channels `opc.order-approval` and `opc.approval-notice`. No migration: the status CHECK already held the values. (SWHR-T-0119)
- **Admin data service.** `POST /api/admin/order-data` dispatches on `type`: GETORDERS, UPDATESTATUS (queues decisions and answers before any status changes), REVENUE and ORDERS. It needs a signed-on admin session by cookie or `Authorization: Session <id>`. Unknown or malformed requests get fixed error texts. (SWHR-T-0122)
- **Decision processing.** The `order-approval` consumer changes a status only from PENDING, sends one supplier purchase order per approval and queues one customer notice per batch. Duplicate, late or unknown-order decisions are ignored. (SWHR-T-0121)
- **Automatic approval.** Order intake enqueues an APPROVED decision, in the same transaction, for en_US orders under 500 and ja_JP orders under 50000 (strict less-than). zh_CN orders always wait. A redelivered order enqueues no second approval. (SWHR-T-0120)
- **Screens.** `/admin/console` is now the landing page with "Launch Rich Client" and "logout". `/admin/orders` is the "Pet Store Administration" workspace. It has a sortable Process Pending Orders table with status badges, bulk and per-row marks, and Commit. It also has read-only View Non-Pending Orders, Sales pie and bar charts with date validation and the 01/01/2001–12/31/2002 default, Refresh with a discard warning, a busy message and a Fatal Error dialog. (SWHR-T-0123)
- **E2E.** `e2e/order-approval.spec.ts` covers launch, logout, closing with an uncommitted mark, approve–commit–refresh, and a sales bar-chart reload. (SWHR-T-0124)

## Divergence from plan

The six tasks ran in the planned dependency order. Planning-time spec discrepancies SD-1 to SD-11 are recorded in the change's `design.md` §Sprint planning, and were built as resolved there. Delivery deviations, each recorded in its ticket summary:

- SWHR-T-0122: no separate `adminData.test.ts`. The route tests exercise the lib through the real database. GETORDERS answers 400 for a status outside the five stored values.
- SWHR-T-0123: chart series start at `chart-primary` then `chart-5`, `-6`, `-7`, `-3`, `-4`, because `chart-1`/`chart-2` are near-white tints. DESIGN.md §Charts has been corrected at close to match. The non-pending mockup's "Showing 9 of 18 … scroll" footer shows a plain count instead. The console i18n keys were renamed to `launchClientButton` and `logoutButton`.
- SWHR-T-0124: the checkout helper fills the e-mail fields, to avoid defect SWHR-T-0125 (see Defects Raised). The sales range journey (task 6.2) has no case key.
- SWHR-T-0121: the plugin files had to be added after the red commit so the stub-first red run would be valid.

## Verification

The verdict is PASS. All 53 delta scenarios pass. Lint, typecheck, build and 899 unit tests are green, and Chromium E2E passed 69 of 69 with none skipped. No integration defects were found. See [qa-test-report.md](qa-test-report.md), [integration-test-result.md](integration-test-result.md) and [integration-defects-resolution.md](integration-defects-resolution.md).

## Root docs

- **DESIGN.md** was updated at close. The Charts token row and §Charts now give the series order that shipped, and say that `chart-1`, `chart-2` and `chart-8` are never series colours. The status colours, tables, dialogs and charts sections were added by SWHR-T-0116 at planning.
- **ARCHITECTURE.md** was updated by SWHR-T-0116 at planning: the `lib/orders/` line, Administrator data, the two new channels, and the Key Decision "Approval decisions are documents on the outbox, applied only to PENDING orders". What shipped matches them, so it is unchanged at close.
- **PRODUCT.md** is unchanged. Its capability map already lists `order-approval`, and its decided behaviour 1 already states the thresholds.
- **AGENTS.md** is human-authored and was not touched.

No dated Changelog entry was added. The planning role forbids new changelog entries, and the commit message records the change.

## Open items

The sprint was not conditionally approved, so there is no Known Issues section. These items stay open after close:

- **Customer e-mail not sent yet (SD-10).** Approval notices queue on `opc.approval-notice`. They stay pending until customer-notifications (swhr-i-0013) registers its consumer.
- **Landing-page label (SD-9).** The mockup says "Log out" and the scenario says "logout". The scenario won, and PRD Open question 1 records that the scenario may be edited.
- **Design fidelity not checked.** QA did not compare the admin screens with the mockups. Page tests and the E2E journeys cover them.
- **Carried items.** SD-1 and SD-9 of SWHR-S-0011, and SWHR-T-0103 (re-add rule), remain as recorded in that sprint's summary.

## Defects Raised

- **SWHR-T-0125** (DEFECT, REFINED): checkout with a blank e-mail leaves the order stuck, because `order-intake` rejects an empty `EmailId` on every retry. Found by SWHR-T-0124. It predates this sprint (checkout, SWHR-S-0011), and bugfix sprint SWHR-S-0013 is queued for it.

## Retrospective

- **Went well:** it reached QA with zero integration defects, and all 53 scenarios passed on first verification. Every behaviour ticket recorded a platform red/green run, which was the SWHR-S-0011 lesson.
- **Went well:** the ARCHITECTURE Key Decision "One outbox for every asynchronous hop" settled SD-2 at planning. Decisions became documents on the outbox, not a new table, and the PENDING guard made duplicates harmless without extra machinery.
- **Went well:** writing E2E journeys against the real intake pipeline surfaced SWHR-T-0125, a checkout defect that unit tests with pre-filled data had hidden.
- **Could improve:** planning named `chart-*` "in order" in DESIGN.md without checking that the first tokens are usable series colours. The implementer had to deviate. Token claims in DESIGN.md should be checked against `src/index.css` when they are written.
- **Could improve:** eleven spec discrepancies were again resolved by planning rather than in the spec. The owed spec edits (for example SD-9) should be applied before later sprints build on them.

## Compliance / Control Evidence

| Control                        | Evidence                                                       | Location                                                                                  | Status    | Exception                                         |
| ------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------- | ------------------------------------------------- |
| Work planned before execution  | Change proposal, design, spec delta, tasks; per-ticket PLAN.md | `openspec/changes/swhr-i-0010-order-approval/` (archived at close), `SWHR-T-01xx/PLAN.md` | Satisfied | —                                                 |
| Tests executed per ticket      | TDD result per ticket                                          | `artifacts/SWHR-S-0012/SWHR-T-0119` … `SWHR-T-0124/tdd-test-result.md`                    | Satisfied | —                                                 |
| Change verified before release | QA report, PASS, 53/53 scenarios, 69/69 E2E                    | `artifacts/SWHR-S-0012/qa-test-report.md`                                                 | Satisfied | —                                                 |
| Defects dispositioned          | 0 integration defects; SWHR-T-0125 raised and queued           | `artifacts/SWHR-S-0012/integration-defects-resolution.md`, SWHR-S-0013                    | Satisfied | —                                                 |
| Spec/PRD consistency           | SD-1 to SD-11 recorded with resolutions                        | `openspec/changes/swhr-i-0010-order-approval/design.md` §Sprint planning                  | Partial   | SD-9 scenario edit owed; SD-10 awaits swhr-i-0013 |
| Release approval               | Sprint reached SPRINT_CLOSE via `validation.all_acs_passed`    | SWHR-T-0126                                                                               | Satisfied | Human approver: Not Provided                      |
