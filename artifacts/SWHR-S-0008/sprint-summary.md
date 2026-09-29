---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0008
idea: SWHR-I-0007
branch: vortex/sprint/swhr-s-0008-ca237af7
upstream:
  [
    artifacts/SWHR-S-0008/SPRINT-PLAN.md,
    artifacts/SWHR-S-0008/qa-test-report.md,
    artifacts/SWHR-S-0008/integration-test-result.md,
    artifacts/SWHR-S-0008/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0008/release-notes.md]
---

# Sprint summary — SWHR-S-0008

## Tickets

| Ticket      | Type  | Title                                                                                       | Outcome                                        |
| ----------- | ----- | ------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| SWHR-T-0077 | TASK  | Sprint plan — SWHR-S-0008                                                                   | DONE                                           |
| SWHR-T-0078 | EPIC  | Customer account and profile                                                                | DONE (rollup)                                  |
| SWHR-T-0079 | STORY | A shopper creates, views and edits their account and gets a personalised store              | DONE (rollup)                                  |
| SWHR-T-0085 | TASK  | Encode the resolved open questions: card-number masking and account reference lists         | DONE (#53) — [summary](SWHR-T-0085/summary.md) |
| SWHR-T-0080 | TASK  | Customer account data model: accounts, contact info, addresses, cards, profile preferences  | DONE (#54) — [summary](SWHR-T-0080/summary.md) |
| SWHR-T-0081 | TASK  | Account domain services: atomic customer creation, defaults, lookups, contact paths, expiry | DONE (#55) — [summary](SWHR-T-0081/summary.md) |
| SWHR-T-0082 | TASK  | Account server routes: registration, read and update with server-side validation            | DONE (#56) — [summary](SWHR-T-0082/summary.md) |
| SWHR-T-0083 | TASK  | Account screens: account page, create and edit forms, empty-field check                     | DONE (#57) — [summary](SWHR-T-0083/summary.md) |
| SWHR-T-0084 | TASK  | Personalisation: My List panel and pet-tips banner                                          | DONE (#58) — [summary](SWHR-T-0084/summary.md) |
| SWHR-T-0086 | TASK  | Customer-account scenario coverage and end-to-end account journeys                          | DONE (#59) — [summary](SWHR-T-0086/summary.md) |
| SWHR-T-0088 | TASK  | Integration QA report — SWHR-S-0008                                                         | DONE (#61), verdict PASS                       |
| SWHR-T-0089 | TASK  | Sprint close bundle — SWHR-S-0008                                                           | this file                                      |

## What shipped

The sprint goal "SWHR-I-0007: Customer account and profile" is met. Change `swhr-i-0007-customer-account-and-profile` adds the new `customer-account` capability, and its scenarios merge into `openspec/specs/customer-account/` at close.

- **Data model.** Each customer owns exactly one profile (language, favourite category, My List and banner preferences) and one account. The account holds a status, contact information with its postal address, and a credit card. Ownership is a unique child-side foreign key with cascading delete, added in migration `drizzle/0006_parched_may_parker.sql`. The existing `profiles` table was extended rather than recreated, so rows written by sign-on keep working. (SWHR-T-0080)
- **Domain services** under `lib/account/`: atomic customer creation with an "active" account, empty records and profile defaults; seeded account creation; lookup and list; the three contact-information creation paths; field-level updates; cascading delete; `MM/YYYY` expiry with the legacy `01`/`2010` fallback. The data layer makes no access decisions. (SWHR-T-0081)
- **Card numbers are never stored or shown in full.** Only the last four digits are kept, and they are shown as `•••• •••• •••• 1111`. The fixed choice lists live in `lib/account/reference.ts`. (SWHR-T-0085)
- **Routes.** `GET` and `PUT /api/account` handle the signed-in user's own account. `POST /api/customers` now takes the full form and writes customer, account, contact, address, card and profile in one transaction. One validator trims every field and answers `400 { missing }` for every blank required field. (SWHR-T-0082)
- **Screens.** `/register` (English and Birds preselected), `/account` (read-only overview with Yes/No pills and the edit control) and `/account-edit` (current values preselected) are built from the sprint mockups. The client blocks submission with "<Field> is empty." and shows server-reported missing fields the same way. Copy is in all three locales. (SWHR-T-0083)
- **Personalisation.** The My List panel under the Pets menu shows up to 10 products from the favourite category. The pet-tips banner on home and cart shows the favourite category's banner and falls back to dogs. Both disappear when their preference is off or the visitor is anonymous. (SWHR-T-0084)
- **Coverage.** `lib/account/scenarios/coverage.test.ts` fails if any approved case goes uncited. The shopper journeys "New shopper creates an account" and "Shopper views and edits their account" now run end to end in Playwright, and so does the personalisation journey. (SWHR-T-0086)

## Divergence from plan

These were minor, and each is recorded in its ticket summary:

- SWHR-T-0080 hand-edited the generated migration so it copies only `userId` and `preferredLanguage` from the old `profiles` table. It also updated `lib/locale/preference.test.ts`, which the plan had listed as unchanged, to insert a `customers` row first.
- SWHR-T-0081 gave the contact-info creators an optional `accountId` so that creation attaches records atomically. The fixed signatures are otherwise unchanged.
- SWHR-T-0083 added `e2e/account-helpers.ts` and `e2e/account.spec.ts`, which were outside its ownership map, and a Cancel link on the form. Its e2e cases seed expiry year 2004 through the API, because the form only offers the current year and the three after it.
- SWHR-T-0084's category-page test now stubs `/api/account` with 401, because the Pets menu now calls it.

## Verification

The verdict is PASS on sprint HEAD `ddc8c6d`. `bun run verify` is green with 145 files and 706 tests. Chromium E2E passed 59 of 59 with none skipped, including the account, personalisation and sign-on-to-account journeys. All 39 delta scenarios have a pass verdict, and no integration defects were found. E2E ran through a temporary `PLAYWRIGHT_BROWSERS_PATH` symlink, because the container's browser revision does not match (SWHR-T-0072); no repository file was changed. See [qa-test-report.md](qa-test-report.md), [integration-test-result.md](integration-test-result.md) and [integration-defects-resolution.md](integration-defects-resolution.md).

## Root docs

At close, no root doc needed a change beyond what planning already made.

- **ARCHITECTURE.md** was updated by SWHR-T-0077 at planning, in two places: the entity list in the data model, and a new Key Decision, "Card numbers are kept as their last four digits only", citing design P3. What shipped matches both.
- **PRODUCT.md** is unchanged. Its capability map and Screens section already listed `customer-account` and the account screens.
- **DESIGN.md** is unchanged. The new screens reuse existing tokens and patterns.
- **AGENTS.md** is human-authored and was not touched.

The close ticket asks for a dated Changelog entry on any root doc update. None was made, both because no doc changed and because the planning role forbids new changelog entries.

## Defects Raised

- **SWHR-T-0087** (DEFECT, P1, BACKLOG). Validation raised it during integration QA. Migration 0005, a catalog migration from SWHR-S-0005, fails on an existing database with `FOREIGN KEY constraint failed` on `DROP TABLE category`. It predates this sprint and does not affect fresh databases or tests.

## Known Issues

- **SWHR-T-0087** — migration 0005 fails on an existing database. A dev or deployed `sqlite.db` created before SWHR-S-0005 cannot reach this sprint's migration 0006 until it is fixed.
- **SWHR-T-0072** — the Playwright browser revision does not match agent and QA containers. `test:e2e` fails its preflight there, even though a working Chromium is present.
- **SWHR-T-0070** — `a2a_run_tests` cannot validate e2e-level test cases.
- **P3 needs human confirmation (unfiled).** Storing only the last four digits answers design Q1 provisionally. A human still has to confirm it over the canvas's token option before checkout (swhr-i-0009) relies on "the card on the account".
- **Design fidelity not checked (unfiled).** QA did not compare the five mockups pixel by pixel. The screens were built from the exported mockups, but nobody checked them visually against those mockups.

## Retrospective

- **Went well:** the dependency chain ran in one pass with no rework and zero integration defects: reference lists → schema → services → routes → screens → personalisation → coverage. That was the first time E2E ran green inside a QA container, through the symlink workaround.
- **Went well:** settling the twelve legacy open questions at planning (P3–P7) meant no implementation ticket stopped to ask a question. Card masking also became a standing architecture decision before any card data was written.
- **Could improve:** three implementation tickets reported "E2E not run: no Chromium". Before SWHR-T-0086, the account E2E specs were effectively unexecuted, and they passed only at integration. Fixing SWHR-T-0072 would let each UI ticket run its own specs. It has now been carried for eight sprints and should be committed next.
- **Could improve:** SWHR-T-0083 needed files outside its ownership map (`e2e/account-helpers.ts`). Planning should list a UI ticket's e2e helper and spec files in its ownership map when an existing spec, here `e2e/sign-on.spec.ts`, must follow a changed form.

## Compliance / Control Evidence

| Control                        | Evidence                                                       | Location                                                                                                | Status    | Exception                                        |
| ------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------ |
| Work planned before execution  | Change proposal, design, spec delta, tasks; per-ticket PLAN.md | `openspec/changes/swhr-i-0007-customer-account-and-profile/` (archived at close), `SWHR-T-00xx/PLAN.md` | Satisfied | —                                                |
| Tests executed per ticket      | TDD result per ticket                                          | `artifacts/SWHR-S-0008/SWHR-T-0080` … `SWHR-T-0086/tdd-test-result.md`                                  | Satisfied | —                                                |
| Scenario coverage enforced     | Coverage test over approved cases                              | `lib/account/scenarios/coverage.test.ts`                                                                | Satisfied | —                                                |
| Change verified before release | QA report, PASS, 39/39 scenarios, 59/59 E2E                    | `artifacts/SWHR-S-0008/qa-test-report.md`                                                               | Satisfied | E2E via browser symlink workaround (SWHR-T-0072) |
| Defects dispositioned          | 0 integration defects; pre-existing SWHR-T-0087 filed          | `artifacts/SWHR-S-0008/integration-defects-resolution.md`                                               | Satisfied | —                                                |
| Sensitive data handling        | Card last-four only; Key Decision recorded                     | `db/schema.ts`, `lib/account/cardNumber.ts`, ARCHITECTURE.md §Key Decisions                             | Satisfied | Human confirmation of P3 outstanding             |
| Release approval               | Sprint reached SPRINT_CLOSE via `validation.all_acs_passed`    | SWHR-T-0088                                                                                             | Satisfied | Human approver: Not Provided                     |
