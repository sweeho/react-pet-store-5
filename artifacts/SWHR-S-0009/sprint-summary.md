---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0009
idea: none
branch: vortex/sprint/swhr-s-0009-c9813735
upstream:
  [
    artifacts/SWHR-S-0009/SPRINT-PLAN.md,
    artifacts/SWHR-S-0009/qa-test-report.md,
    artifacts/SWHR-S-0009/integration-test-result.md,
    artifacts/SWHR-S-0009/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0009/release-notes.md]
---

# Sprint summary — SWHR-S-0009

Goal: Bugfix — SWHR-T-0087, SWHR-T-0070, SWHR-T-0072. Change `swhr-s-0009-bugfix-swhr-t-0087-swhr-t-00`. All three defects fixed; integration QA passed with no defects.

## Tickets

| Ticket      | Type   | Title                                                                  | Outcome                                          |
| ----------- | ------ | ---------------------------------------------------------------------- | ------------------------------------------------ |
| SWHR-T-0090 | TASK   | Bugfix plan — SWHR-S-0009                                              | DONE                                             |
| SWHR-T-0072 | DEFECT | Playwright browser revision mismatch blocks E2E in QA/agent containers | DONE (#62) — [fix note](SWHR-T-0072/fix-note.md) |
| SWHR-T-0087 | DEFECT | Migration 0005 fails on an existing database                           | DONE (#63) — [fix note](SWHR-T-0087/fix-note.md) |
| SWHR-T-0070 | DEFECT | a2a_run_tests can never validate an e2e-level test case                | DONE (#64) — [fix note](SWHR-T-0070/fix-note.md) |
| SWHR-T-0091 | TASK   | Integration QA                                                         | DONE (#66) — [QA report](qa-test-report.md)      |
| SWHR-T-0092 | TASK   | Sprint close bundle                                                    | DONE (this file)                                 |

## What shipped

- **SWHR-T-0087:** a database created before migration 0005 and holding catalogue rows now upgrades at startup and keeps every row. `migrateDatabase` (`lib/db/migrate.ts`) runs migrations with foreign keys off, turns them back on, and refuses to start on a dangling reference. No migration file changed.
- **SWHR-T-0072:** `@playwright/test` is now `~1.60.0` (Chromium revision 1223), matching the QA/agent container. The config and specs needed no change.
- **SWHR-T-0070:** `bun run test:evidence` runs Vitest and Playwright and writes one merged JUnit report at `.vortex-results/junit.xml`, naming e2e results by `e2e/…` path. `testEvidence.command` points at it. With no browser it skips E2E and says so.
- **Outside the tickets:** operator commit `5cad66b` fixed the CI evidence upload. `upload-artifact` skips hidden paths, so the `.vortex-results/` folder from `ee8a6fd` uploaded nothing; the two reports are now named explicitly.

## Verification (from the QA report)

- `bun run verify`: exit 0, 718 unit/integration tests passed.
- `bun run test:e2e` on Playwright 1.60.0 in Chromium: 59 passed, 0 failed, 0 skipped. The preflight exited 0.
- `bun run test:evidence`: exit 0. The merged report holds 718 unit and 59 e2e testcases, every e2e class name prefixed `e2e/`.
- All 11 scenarios pass. Three of them (SWHR-R-0251.02–.04: failing unit tier, failing e2e tier, no browser) were verified only through unit tests with injected fakes, not against real failing suites.

## Root docs

- **ARCHITECTURE.md updated:** the §Database sentence said enforcement is enabled before migrating, which is no longer true. Added a Key Decision: migrations run with enforcement off, then are checked. No changelog entry; the commit message carries it.
- **Unchanged:** PRODUCT.md (no capability or identity change), DESIGN.md (no design-system change) and AGENTS.md (human-authored).

## Retrospective

**Went well**

- Planning reproduced SWHR-T-0087 on a seeded database before decomposing, and confirmed the fix direction through migration 0006. The implementation matched the plan with no rework.
- Planning checked the latest commits before choosing a fix. `ee8a6fd` made the "remove the e2e glob" option harmful, and planning avoided it.
- Playwright 1.50 → 1.60 needed no config or spec change. QA ran the full E2E suite for real for the first time in several sprints.

**Could improve**

- Two tickets went past their ownership maps, both for good reasons, and both are recorded in the fix notes. SWHR-T-0070 added `lib/test-evidence/evidence.ts` so the orchestration could be unit-tested. SWHR-T-0072 added `src/test/playwrightBrowserRevision.test.ts`. Future plans should name the testable seam explicitly.
- Implementation containers still have no Chromium, so neither DevOps ticket could run its own browser paths; only QA could. SWHR-T-0070's failure-path scenarios remain fake-verified.
- The server's root-doc filter strips ticket-description lines that mention `design.md`, which it mistakes for `DESIGN.md`. Descriptions must cite the change directory instead.

## Follow-ups / out of scope

None filed; carried from `openspec/changes/swhr-s-0009-bugfix-swhr-t-0087-swhr-t-00/proposal.md`:

- **F1:** CI uploads Playwright's raw report, whose suite names are relative to `testDir` (no `e2e/` prefix). Only the local merged report is normalised. Whether the platform matches CI e2e results to citations is unverified.
- **F2:** `pretest:e2e`, `pree2e` and `pretest:smoke` call `node`, so they fail in a Bun-only container.
- **F3:** nothing ties the container image's Playwright version to `package.json`, so the revision drift can recur.
