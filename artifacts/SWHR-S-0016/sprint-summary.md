---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0016
idea: SWHR-I-0013
branch: vortex/sprint/swhr-s-0016-6b959966
upstream:
  [
    artifacts/SWHR-S-0016/SPRINT-PLAN.md,
    artifacts/SWHR-S-0016/qa-test-report.md,
    artifacts/SWHR-S-0016/integration-test-result.md,
    artifacts/SWHR-S-0016/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0016/release-notes.md]
---

# Sprint summary — SWHR-S-0016

## Tickets

| Ticket      | Type  | Title                                                                                        | Outcome                                         |
| ----------- | ----- | -------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| SWHR-T-0155 | TASK  | Sprint plan — SWHR-S-0016                                                                    | DONE                                            |
| SWHR-T-0156 | EPIC  | Customer notifications                                                                       | DONE (rollup)                                   |
| SWHR-T-0157 | STORY | Customers are e-mailed at each approval decision, shipment and completion of their order     | DONE (rollup)                                   |
| SWHR-T-0159 | TASK  | Templates: HTML approval, shipment and completed-order e-mails in en_US, ja_JP and zh_CN     | DONE (#111) — [summary](SWHR-T-0159/summary.md) |
| SWHR-T-0158 | TASK  | Data model and configuration: mail.request channel, switches, mail settings, fail-fast start | DONE (#112) — [summary](SWHR-T-0158/summary.md) |
| SWHR-T-0160 | TASK  | Mail request and sender: validation, SMTP transport, mailer and its own poller, no retry     | DONE (#113) — [summary](SWHR-T-0160/summary.md) |
| SWHR-T-0161 | TASK  | Notification producers: consumers on approval-notice, invoice and completed-order            | DONE (#114) — [summary](SWHR-T-0161/summary.md) |
| SWHR-T-0162 | TASK  | Tests: lifecycle scenarios, slow and unreachable mail server, case coverage check            | DONE (#115) — [summary](SWHR-T-0162/summary.md) |
| SWHR-T-0163 | TASK  | Integration QA report — SWHR-S-0016                                                          | DONE (#117), verdict PASS                       |
| SWHR-T-0164 | TASK  | Sprint close bundle — SWHR-S-0016                                                            | this file                                       |

## What shipped

The sprint goal "SWHR-I-0013: Customer notifications" is met. Change `swhr-i-0013-customer-notifications` adds the `customer-notifications` capability; its scenarios merge into `openspec/specs/` at close. Customers are now e-mailed when their order is approved or denied, at every shipment, and when the order completes, in the order's locale. Order processing never waits on mail.

- **Channel and configuration.** A `mail.request` outbox channel (subscriber `mailer`) instead of a new table (SD-1). `lib/notifications/config.ts` reads the three switches from `configs/notification-config.json` (all `true`, SD-6) and the SMTP host, port, credentials and sender from the environment (sender default `customerservice@javapetstoredemo.com`). A missing or non-boolean switch stops the server at start. (SWHR-T-0158)
- **Templates.** `lib/email/` approval, shipment and completed-order bodies are now self-contained inline-styled HTML following the mockups, in en_US, ja_JP and zh_CN, with the spec subjects `Java Pet Store Order Status|Shipped|COMPLETED: <id>` in every locale (SD-3). Every interpolated value is escaped. (SWHR-T-0159)
- **Sender.** `parseMailRequest` / `enqueueMail` validate the request strictly; `createSmtpTransport` sends via nodemailer with bounded timeouts; the `mailer` consumer sends each request once, logs and drops a failed send, and dead-letters a malformed request at once through the new `NonRetryableError`. `plugins/mail-sender.ts` polls only `mail.request`, the general dispatcher polls everything else, and neither starts a pass while its last is running. (SWHR-T-0160)
- **Producers.** Three `customer-notification` consumers on `opc.approval-notice` (one e-mail per order in a batch), `opc.invoice` (only the shipped lines, joined to the stored order for category, product and price, SD-7) and `opc.completed-order` (every line). A switched-off kind consumes its trigger silently. Approval and fulfilment code is untouched (SD-10). (SWHR-T-0161)
- **Scenario tests.** `lib/notifications/scenarios/` runs the real consumers end to end on the in-memory database with a capturing transport: the four-e-mail lifecycle, a slow mail server and a down mail server, plus a coverage test requiring every case SWHR-C-0001 and SWHR-C-0413 to 0430 to be cited. (SWHR-T-0162)

## Divergence from plan

The five tasks ran in the planned order (P6). Planning-time discrepancies SD-1 to SD-12 are in the change's `design.md` §Sprint planning and were built as resolved there. Delivery deviations, each recorded in its ticket summary:

- SWHR-T-0159: an approval e-mail with no `decision` throws rather than defaulting. The status icon is a text glyph and the logo a "P" square, because inline SVG is unreliable in mail clients.
- SWHR-T-0160: `createSmtpTransport(settings, transporter?)` gained an optional second parameter for tests; P3's one-argument call is unchanged.
- SWHR-T-0158: the MCP transport dropped on `a2a_run_tests`, so no platform red or green run is recorded. The local red failed 19 tests before implementation and `bun run verify` passed after.

## Verification

The verdict is PASS. All 19 delta scenarios pass and every approved case has a citing test, enforced by `coverage.test.ts`. Lint, typecheck and build are green, 1073 unit and integration tests pass, and Chromium E2E passed 74 of 74 with none skipped (a regression check only: the capability has no screens). No integration defects were found. Design fidelity was checked by comparing mockup text to the templates; no rendered comparison was run. See [qa-test-report.md](qa-test-report.md), [integration-test-result.md](integration-test-result.md) and [integration-defects-resolution.md](integration-defects-resolution.md).

## Root docs

- **ARCHITECTURE.md** was updated by SWHR-T-0155 at planning: nodemailer in the stack, the `mail.request` channel and split pollers in Messaging, a "Customer e-mail" section, the non-retryable path on the outbox Key Decision, and the Key Decision "Customer e-mail is queued, sent once and never retried". What shipped matches, so it is unchanged at close.
- **PRODUCT.md** already carried the `customer-notifications` capability line, goal 4 and non-goal 11 (no retry of failed e-mail). What shipped matches, so it is unchanged.
- **DESIGN.md** is unchanged. The e-mails are rendered with inline styles in their own templates; no design-system token or pattern changed.
- **AGENTS.md** is human-authored and was not touched.

No dated Changelog entry was added. The planning role forbids new changelog entries, and the commit message records the change.

## Open items

The sprint was not conditionally approved, so there is no Known Issues section. These items stay open after close:

- **Backlog flush on first deploy.** Every order since SWHR-S-0012 has pending `customer-notification` deliveries, so the first deploy e-mails those customers their old notices at once. An operator who does not want that should switch the kinds off for the first start, then back on.
- **ja_JP and zh_CN wording (SD-4).** The translations in SWHR-T-0159's summary were written without the legacy stylesheets and need a human sign-off.
- **Subjects stay English (SD-3)** in every locale, and the **brand** differs between subject ("Java Pet Store") and heading ("Pet Store") (SD-12). Both await a human decision.
- **No local SMTP.** Dev and E2E sends to `localhost:25` fail and are logged. That is the specified behaviour, but it means no environment in the pipeline delivers a real e-mail.
- **Carried from SWHR-S-0015:** the lookup-failure message on the inventory screen (SD-6), who may run a forced stock reload (Q1), and the in-process supplier boundary (PRODUCT open question 3).

## Defects Raised

None. No DEFECT ticket was created during the sprint.

## Retrospective

- **Went well:** zero integration defects for the fourth sprint running; all 19 scenarios passed on first verification.
- **Went well:** the codebase findings showed the three trigger channels and their `customer-notification` subscriber already existed, so the producers were plain consumers and order processing was not touched. Using the outbox instead of a second queue (SD-1) kept one delivery mechanism.
- **Went well:** the coverage test binds every approved case id to a test title, so a dropped test fails the build rather than going unnoticed.
- **Could improve:** the test-run tool dropped again (SWHR-T-0158), the second sprint running with one ticket lacking platform red/green evidence.
- **Could improve:** twelve spec discrepancies were found at planning, several of them open canvas questions (subjects, brand, translations). These should be settled at ideation, before planning.
- **Could improve:** the e-mail design was verified only by text comparison. A rendered snapshot of each template against its mockup would give real design evidence for a capability whose only output is visual.

## Compliance / Control Evidence

| Control                        | Evidence                                                       | Location                                                                                          | Status    | Exception                                 |
| ------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------- |
| Work planned before execution  | Change proposal, design, spec delta, tasks; per-ticket PLAN.md | `openspec/changes/swhr-i-0013-customer-notifications/` (archived at close), `SWHR-T-01xx/PLAN.md` | Satisfied | —                                         |
| Tests executed per ticket      | TDD result per ticket                                          | `artifacts/SWHR-S-0016/SWHR-T-0158` … `SWHR-T-0162/tdd-test-result.md`                            | Partial   | SWHR-T-0158 has no platform-recorded runs |
| Change verified before release | QA report, PASS, 19/19 scenarios, 74/74 E2E                    | `artifacts/SWHR-S-0016/qa-test-report.md`                                                         | Satisfied | —                                         |
| Defects dispositioned          | 0 integration defects                                          | `artifacts/SWHR-S-0016/integration-defects-resolution.md`                                         | Satisfied | —                                         |
| Spec/PRD consistency           | SD-1 to SD-12 recorded with resolutions                        | `openspec/changes/swhr-i-0013-customer-notifications/design.md` §Sprint planning                  | Partial   | SD-3, SD-4, SD-12 await a human           |
| Release approval               | Sprint reached SPRINT_CLOSE via `validation.all_acs_passed`    | SWHR-T-0163                                                                                       | Satisfied | Human approver: Not Provided              |
