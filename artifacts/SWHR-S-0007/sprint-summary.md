---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0007
idea: Not Applicable
branch: vortex/sprint/swhr-s-0007-01ffeb9c
upstream:
  [
    artifacts/SWHR-S-0007/SPRINT-PLAN.md,
    artifacts/SWHR-S-0007/qa-test-report.md,
    artifacts/SWHR-S-0007/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0007/release-notes.md]
---

# Sprint summary — SWHR-S-0007

## Tickets

| Ticket      | Type   | Title                                                                                | Outcome                                          |
| ----------- | ------ | ------------------------------------------------------------------------------------ | ------------------------------------------------ |
| SWHR-T-0074 | TASK   | Bugfix plan — SWHR-S-0007                                                            | DONE                                             |
| SWHR-T-0065 | DEFECT | a2a_run_tests green verdict false-positives on stub-sentinel text in historical docs | DONE (#50) — [fix note](SWHR-T-0065/fix-note.md) |
| SWHR-T-0075 | TASK   | Integration QA report — SWHR-S-0007                                                  | DONE (#52), verdict PASS                         |
| SWHR-T-0076 | TASK   | Sprint close bundle — SWHR-S-0007                                                    | this file                                        |

## What shipped

The sprint goal "Bugfix — SWHR-T-0065" is met in the repository, under change `swhr-s-0007-bugfix-swhr-t-0065-a2a-run-t`, which adds requirement "Stub sentinel confined to live stubs" to `local-development`.

- **The last literal sentinel occurrences are gone.** The SWHR-T-0064 title cell in `artifacts/SWHR-S-0006/SPRINT-PLAN.md` now reads "the configured stub sentinel". The hygiene guard builds its constant from the same escape `.vortex/config.yaml` uses. A tracked-file search at close finds no literal anywhere in the repository.
- **The guard covers every documentation location.** `src/utils/stubSentinelHygiene.test.ts` now scans everything under `artifacts/`, `openspec/` and `.vortex/`, plus the root `*.md` files, instead of only `tdd-test-result.md`. It still skips source and test files, where red-phase stubs are legitimate. A self-check keeps the decoded constant at 20 characters with the `Vortex` prefix and equal to the config value.

## Divergence from plan

None. SWHR-T-0065 touched only its ownership map. `.vortex/config.yaml` is unchanged, as design.md required.

## Verification

The verdict is PASS. `bun run verify` is green: 131 files and 629 tests. All 4 scenarios of SWHR-R-0248 pass, via cases SWHR-C-0441 to SWHR-C-0447. The "caught" behaviour was also probed live: a temporary quoting file made the guard fail and name it, and the file was not committed. Integration found no defects. E2E did not run because of the container's Chromium mismatch (SWHR-T-0072); the sprint touches no UI.

The live defect check passed. SWHR-T-0065's own platform green run (`01d0cf38-…`) came back valid, with all 7 cases passing and no stub-sentinel reason cited. This is the first fully valid green run recorded since SWHR-S-0004. Platform follow-up F1 (scoping the scanner) therefore has no new evidence, but it remains the durable fix. See [qa-test-report.md](qa-test-report.md) and [integration-defects-resolution.md](integration-defects-resolution.md).

## Root docs

No root doc changed, because no trigger fired. PRODUCT.md is unchanged: no new capability shipped, only a repository-hygiene requirement. ARCHITECTURE.md is unchanged: no topology, data-model or integration change. DESIGN.md is unchanged: there is no UI change. AGENTS.md is human-authored, and its existing `.vortex/agents-generated.md` note on sentinel wording still applies.

## Defects Raised

None this sprint.

## Known Issues

- **SWHR-T-0072** (BACKLOG) — the Playwright browser revision does not match agent and QA containers, so E2E runs only in CI.
- **SWHR-T-0070** (BACKLOG) — `a2a_run_tests` cannot validate e2e-level test cases, because `testGlobs` and the Vitest config disagree.
- **Follow-up F1 (platform, unfiled)** — the platform's green scan is still repo-wide. The repo is clean and guarded, but the scan itself is not scoped to the ticket's diff.
- **Follow-up F2 (unfiled)** — platform-generated `SPRINT-PLAN.md` indexes copy ticket titles verbatim. A future title that quotes the sentinel would re-add it. The widened guard catches that on the sprint branch.

## Retrospective

- **Went well:** re-verifying the defect during planning showed that SWHR-S-0006 had already addressed 11 of its cited files. That cut the ticket to two residual lines and a guard widening. It shipped in one pass, and the first green run was valid.
- **Went well:** keeping source and test files out of the guard's scope preserved the red-phase stub convention. The red run failed on the stubs as intended, not on the guard.
- **Could improve:** SWHR-T-0065 was filed from evidence that was already stale when SWHR-S-0006 closed. Triage should check open platform-tool defects against the most recent close summary before committing them to a sprint.
- **Could improve:** SWHR-T-0072 is now carried for a seventh sprint. It should be committed to the next sprint rather than carried again.

## Compliance / Control Evidence

| Control                        | Evidence                                                    | Location                                                                                                | Status    | Exception                                 |
| ------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------- |
| Work planned before execution  | Change proposal, design, spec delta, tasks; PLAN.md         | `openspec/changes/swhr-s-0007-bugfix-swhr-t-0065-a2a-run-t/` (archived at close), `SWHR-T-0065/PLAN.md` | Satisfied | —                                         |
| Root cause recorded per defect | Fix note                                                    | `artifacts/SWHR-S-0007/SWHR-T-0065/fix-note.md`                                                         | Satisfied | —                                         |
| Tests executed per ticket      | TDD result, red and green platform runs both valid          | `artifacts/SWHR-S-0007/SWHR-T-0065/tdd-test-result.md`                                                  | Satisfied | —                                         |
| Change verified before release | QA report, PASS, 4/4 scenarios                              | `artifacts/SWHR-S-0007/qa-test-report.md`                                                               | Satisfied | E2E blocked in QA container (SWHR-T-0072) |
| Defects dispositioned          | 0 integration defects                                       | `artifacts/SWHR-S-0007/integration-defects-resolution.md`                                               | Satisfied | —                                         |
| Release approval               | Sprint reached SPRINT_CLOSE via `validation.all_acs_passed` | SWHR-T-0075                                                                                             | Satisfied | Human approver: Not Provided              |
