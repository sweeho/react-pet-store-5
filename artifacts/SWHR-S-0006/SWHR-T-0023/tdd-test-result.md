---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0006
ticket: SWHR-T-0023
branch: vortex/fix/SWHR-T-0023-pet-category-and-area-navigation-labels-9fdb6112
upstream: [artifacts/SWHR-S-0006/SWHR-T-0023/PLAN.md]
---

# TDD result — SWHR-T-0023

This ticket has platform-linked test cases (`a2a_get_test_cases`). The red and green runs
below are the ones `a2a_run_tests` recorded; the DONE gate reads those records, not a
typed marker.

## Test cases

| Case        | Test                                                         | Covers                                                                      |
| ----------- | ------------------------------------------------------------ | --------------------------------------------------------------------------- |
| SWHR-C-0437 | `src/components/layout/GlobalNav.test.tsx › [SWHR-C-0437] …` | AC-1 (Global nav — Primary-area labels in Japanese), unit-level             |
| SWHR-C-0439 | `src/components/layout/GlobalNav.test.tsx › [SWHR-C-0439] …` | AC-2 (Global nav — Primary-area labels in Simplified Chinese), unit-level   |
| SWHR-C-0436 | `e2e/shell.spec.ts › [SWHR-C-0436] …`                        | AC-1, real-browser proof                                                    |
| SWHR-C-0438 | `e2e/shell.spec.ts › [SWHR-C-0438] …`                        | AC-2, real-browser proof                                                    |
| SWHR-C-0440 | `e2e/shell.spec.ts › [SWHR-C-0440] …`                        | AC-3 (Global nav — Primary-area labels in the default locale)               |
| SWHR-C-0431 | `e2e/shell.spec.ts › [SWHR-C-0431] …`                        | AC-4 (Category navigation menu — Menu in Japanese), regression only         |
| SWHR-C-0432 | `e2e/catalog-browsing.spec.ts › [SWHR-C-0432] …`             | AC-5 (Category product listing page — heading in Japanese), regression only |

## Runs

- **Red** — run `ba65ec6a-a338-4d55-8a6a-c15153a39c33` at commit
  `170e2625a2ff440b94294b00564934d345520b77` (tests committed, source not yet fixed).
  SWHR-C-0437: `assertion_failure`. SWHR-C-0439: `assertion_failure`. Both fail with
  `AssertionError: expected null not to be null` — the ja_JP/zh_CN storefront links
  genuinely don't exist yet because `GlobalNav` still renders `area.label` (hardcoded
  English) regardless of locale. Two earlier attempts at this same red (run ids
  `9d98dd42…` and `bdead106…`) came back `error` instead of `assertion_failure` for these
  two cases — `getByRole`/`findByRole` throw `TestingLibraryElementError` on a miss, and
  jest-dom's `toBeInTheDocument()` throws a bare `TypeError` when given `null` outside
  `.not`; neither reads as a test failure to the platform's reader. Switched to
  `queryByRole` + `expect(...).not.toBeNull()` to get a clean assertion failure — see the
  git history on `src/components/layout/GlobalNav.test.tsx`.
  SWHR-C-0431/-0432/-0436/-0438/-0440 (all Playwright/e2e): `outcomes: []` — the run
  could not execute `e2e/shell.spec.ts` / `e2e/catalog-browsing.spec.ts` at all (see Notes).
- **Green** — run `538f41e2-b4ba-4139-99dd-b151fa108ebe` at commit
  `9da8e4d325e946651156fc2d123fe3143ad8048a` (fix applied). SWHR-C-0437: `pass`.
  SWHR-C-0439: `pass`. The overall `valid` flag came back `false`; every remaining reason
  names the five e2e-linked cases having "no test citing it" even though the citing tests
  are committed and pass `bun x playwright test --list` locally (see Notes) — same
  environment gap as red, not a code defect. `modified_after_red` is empty. Per this
  project's dispatch instructions, DONE is not gated on this run; it is recorded here as
  evidence.

## Notes

- `a2a_run_tests` appears to execute in this same container, which has no Chromium
  installed (`bun run verify:full` fails at the `pretest:e2e` preflight with "Playwright's
  Chromium browser is not installed", and instructs against installing one or retrying —
  AGENTS.md: E2E runs in the QA-phase browser-equipped container and in CI, not engineer
  containers). That is the most likely explanation for why none of the five e2e-linked
  cases (SWHR-C-0431, -0432, -0436, -0438, -0440) produced a red/green verdict on either
  run, despite `bun x playwright test --list` confirming all five titles load and parse
  correctly (54 tests across 9 files, unchanged file count). Per AGENTS.md and the
  workflow's own guidance, E2E was not retried and no browser was installed.
- SWHR-C-0431 and SWHR-C-0432 pin already-correct behavior (design.md § Context: the
  category half was fixed by SWHR-S-0005) — they are regression tests, not expected to
  fail pre-fix on the category piece itself. Their citing tests exist in the same commits
  as the other e2e cases above.
- Full pre-commit gate, run locally in this container: `bun run verify` (lint + typecheck
  - the complete Vitest suite, both projects) — 129 files, 621 tests, all passed, 0
    failed, including `GlobalNav.test.tsx` and the rest of `SiteLayout.test.tsx`.
    `bun run verify:full` falls back to `bun run verify` per AGENTS.md's stated preflight
    behavior (Chromium genuinely missing here); Validation runs the E2E tier at
    INTEGRATION_QA in its browser-equipped container.
