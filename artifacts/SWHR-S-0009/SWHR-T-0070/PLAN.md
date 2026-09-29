# PLAN — SWHR-T-0070: e2e test cases cannot get test evidence

Change: `swhr-s-0009-bugfix-swhr-t-0087-swhr-t-00` · Requirement: **End-to-end tests produce test evidence** (`local-development`)

## Design reference

No design blocks: this bugfix sprint has no idea canvas design.

## Objective

The configured test-evidence command runs Vitest and Playwright and writes one merged JUnit report at `.vortex-results/junit.xml`, so an e2e-level test case gets an official red/green result. The root cause is in `openspec/changes/swhr-s-0009-bugfix-swhr-t-0087-swhr-t-00/proposal.md` §Why. Depends on SWHR-T-0072, which makes the browser usable and also edits `package.json`.

## Steps

1. Read `design.md` §Context, D4 and D5. Keep `e2e/**/*.spec.ts` in `testGlobs` (D4).
2. Measure the real Vitest and Playwright JUnit attribute shapes from one run of each (D5).
3. Test-first: write `lib/test-evidence/merge-junit.test.ts`, then implement `mergeJunitReports` in `lib/test-evidence/merge-junit.ts`.
4. Write `scripts/test-evidence.ts` per D4 and add the `test:evidence` package script.
5. Point `.vortex/config.yaml` `testEvidence.command` at `bun run test:evidence`, keep `junitPath`, and update the comment above the block, which currently says E2E has no report here.
6. Exercise the four scenarios by hand (browser present; a deliberately failing unit test; a deliberately failing e2e test; the preflight made to fail). Revert the deliberate failures.
7. Link one e2e-level test case and run `a2a_run_tests` red/green. Record the verdict reasons as the live check (`design.md` Risks, proposal F1).

## File/module ownership

- `lib/test-evidence/merge-junit.ts` (new)
- `lib/test-evidence/merge-junit.test.ts` (new)
- `scripts/test-evidence.ts` (new)
- `package.json` (`scripts` block only)
- `.vortex/config.yaml` (the `testEvidence` block only: `command` and its comment)

Fixed interface: `mergeJunitReports(reports: { xml: string; pathPrefix?: string }[]): string`, pure. `junitPath` stays `.vortex-results/junit.xml`. `.github/workflows/ci.yml` is NOT changed.

## Definition of Done

AC-1 … AC-4 of the ticket. AC-1 is also covered by `merge-junit.test.ts` for the path prefixing and summed counts.
