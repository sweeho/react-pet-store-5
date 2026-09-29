---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0006
idea: Not Applicable
branch: vortex/sprint/swhr-s-0006-c8ce8a09
upstream:
  [
    artifacts/SWHR-S-0006/SPRINT-PLAN.md,
    artifacts/SWHR-S-0006/qa-test-report.md,
    artifacts/SWHR-S-0006/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0006/release-notes.md]
---

# Sprint summary — SWHR-S-0006

## Tickets

| Ticket      | Type   | Title                                                                     | Outcome                                          |
| ----------- | ------ | ------------------------------------------------------------------------- | ------------------------------------------------ |
| SWHR-T-0069 | TASK   | Bugfix plan — SWHR-S-0006                                                 | DONE                                             |
| SWHR-T-0064 | DEFECT | Green-run stub-sentinel scan false-positives on config and artifact prose | DONE (#45) — [fix note](SWHR-T-0064/fix-note.md) |
| SWHR-T-0050 | DEFECT | `bun run dev` 500s on any route touching `db/client.ts`                   | DONE (#46) — [fix note](SWHR-T-0050/fix-note.md) |
| SWHR-T-0023 | DEFECT | Pet-category and area navigation labels stay English in ja_JP and zh_CN   | DONE (#47) — [fix note](SWHR-T-0023/fix-note.md) |
| SWHR-T-0071 | TASK   | Integration QA report — SWHR-S-0006                                       | DONE (#49), verdict PASS                         |
| SWHR-T-0073 | TASK   | Sprint close bundle — SWHR-S-0006                                         | this file                                        |

## What shipped

The sprint goal "Bugfix — SWHR-T-0023, SWHR-T-0050, SWHR-T-0064" is met. All three defects are fixed under one change, `swhr-s-0006-bugfix-swhr-t-0023-swhr-t-00`.

- **Area navigation is localized** (SWHR-T-0023, design D1). `GlobalNav.tsx` now resolves the Search, Cart, Checkout, Account, Administration and Supplier links from the `shell` screen by area id. `shell.ts` gains a `checkout` key: Checkout / 購入手続き / 结账. `src/constants/navigation.ts` no longer carries the display-only `label` and `sampleBreeds` fields. SWHR-S-0005 had already fixed the category half of the report, so that half gained regression tests only.
- **The dev server runs under Bun** (SWHR-T-0050, design D2). The `dev` script is now `bun --bun ./node_modules/vite/bin/vite.js`. Before this, Vite's Node shebang won whenever Node was on PATH, and `bun:sqlite` routes returned 500. Playwright's web server now starts through `bun run dev`, so E2E in CI guards the same entry point developers use.
- **Mitigated the stub-sentinel false positive** (SWHR-T-0064, design D3). `.vortex/config.yaml` stores the sentinel as an escaped YAML scalar that decodes to the same value. 13 historical `tdd-test-result.md` files now refer to "the configured stub sentinel". `src/utils/stubSentinelHygiene.test.ts` guards both. A note in `.vortex/agents-generated.md` tells later agents to use the same wording.

## Divergence from plan

- None in scope. Each ticket touched only the files in its ownership map, and QA's diff check confirmed that.
- One residual was left on purpose. `SPRINT-PLAN.md` is platform-generated, and it quotes SWHR-T-0064's own title, which contains the sentinel text. The file is outside every ticket's ownership map, and the platform regenerates it.

## Verification

The verdict is PASS. Install, build, lint and typecheck are clean. 624/624 unit and integration tests pass across 131 files. All 11 scenarios in the three delta specs pass: site-shell, catalog-browsing and local-development. Integration found no defects.

E2E could not run in the QA container. The pinned `@playwright/test ~1.50` expects Chromium 1155, and the container ships 1223. QA verified the E2E-only scenarios with executed component tests instead. `devServerRuntime.test.ts` ran with Node on PATH in QA, so the SWHR-T-0050 regression path was exercised for real. See [qa-test-report.md](qa-test-report.md) and [integration-defects-resolution.md](integration-defects-resolution.md).

The sentinel mitigation worked. SWHR-T-0050 and SWHR-T-0023 merged after SWHR-T-0064, and neither green run lists a stub-sentinel reason. Both still report `valid: false`, but only because their E2E-cited cases have "no test citing it". That cause is SWHR-T-0070.

## Root docs

No root doc changed at close, because no trigger fired. PRODUCT.md is unchanged: the sprint added no capability. ARCHITECTURE.md is unchanged: the topology is the same, and `navigation.ts` is still the one list of primary areas. DESIGN.md is unchanged: no token or pattern changed. AGENTS.md is human-authored. SWHR-T-0064 recorded its correction in `.vortex/agents-generated.md`.

## Defects Raised

- **SWHR-T-0070** (BACKLOG) — `a2a_run_tests` cannot validate an e2e-level test case, because its `testGlobs` do not match the Vitest config. Raised by devops during SWHR-T-0050.
- **SWHR-T-0072** (BACKLOG) — a Playwright browser revision mismatch blocks E2E in QA and agent containers. Raised by validation.

## Known Issues

- **SWHR-T-0072** — E2E cannot run in agent or QA containers because of the Playwright pin versus the image's Chromium revision. CI is unaffected.
- **SWHR-T-0070** — green `a2a_run_tests` verdicts stay `invalid` for any ticket with E2E-linked test cases.
- **SWHR-T-0065** (REFINED) — the platform-side twin of SWHR-T-0064. The repo-side mitigation is in place. The durable fix is follow-up F1 in the change proposal: scope the scan to the ticket's diff or its stub call sites. That fix is platform work.
- **Follow-up F2 (unfiled)** — the `preview` script is still plain `vite preview` and may hit the same Node-shebang issue. It is unverified.

## Retrospective

- **Went well:** re-verifying SWHR-T-0023 on the sprint base during planning showed that the category half was already fixed. That cut the ticket to one component and turned the rest into regression tests. Each of the three fixes landed in one pass with no plan revision.
- **Went well:** sequencing SWHR-T-0023 after SWHR-T-0064 made the next green runs a live check of the sentinel mitigation. That check confirmed the mitigation worked.
- **Could improve:** for the sixth sprint running, no agent container could run Playwright. That leaves QA to reconstruct E2E coverage by hand. SWHR-T-0072 should be committed to the next sprint instead of carried again.
- **Could improve:** SWHR-T-0050 was a pre-existing defect that stayed open for two sprints. It hid because the planning and implementation containers had no Node binary, so they could not reproduce it. When a defect depends on the environment, the plan should name the environment that reproduces it. Here, that was QA and CI with Node on PATH.

## Compliance / Control Evidence

| Control                        | Evidence                                                    | Location                                                                                                                   | Status    | Exception                                                      |
| ------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- |
| Work planned before execution  | Change proposal, design, specs, tasks; per-ticket PLAN.md   | `openspec/changes/swhr-s-0006-bugfix-swhr-t-0023-swhr-t-00/` (archived at close), `artifacts/SWHR-S-0006/SWHR-T-*/PLAN.md` | Satisfied | —                                                              |
| Root cause recorded per defect | Fix notes                                                   | `artifacts/SWHR-S-0006/SWHR-T-{0023,0050,0064}/fix-note.md`                                                                | Satisfied | —                                                              |
| Tests executed per ticket      | TDD results                                                 | `artifacts/SWHR-S-0006/SWHR-T-{0023,0050,0064}/tdd-test-result.md`                                                         | Satisfied | Green verdicts `invalid` from SWHR-T-0070; E2E not run locally |
| Change verified before release | QA report, PASS, 11/11 scenarios                            | `artifacts/SWHR-S-0006/qa-test-report.md`                                                                                  | Satisfied | E2E blocked in QA container (SWHR-T-0072)                      |
| Defects dispositioned          | 0 integration defects; tooling defects filed                | `artifacts/SWHR-S-0006/integration-defects-resolution.md`, SWHR-T-0070, SWHR-T-0072                                        | Satisfied | —                                                              |
| Release approval               | Sprint reached SPRINT_CLOSE via `validation.all_acs_passed` | SWHR-T-0071                                                                                                                | Satisfied | Human approver: Not Provided                                   |
