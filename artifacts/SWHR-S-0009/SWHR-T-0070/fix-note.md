# Fix note — SWHR-T-0070

**Root cause:** `testEvidence.testGlobs` includes `e2e/**/*.spec.ts`, but `testEvidence.command` ran Vitest only and no Vitest project can load a Playwright spec, so an e2e-level case never got a valid `a2a_run_tests` result.

**Fix:** `bun run test:evidence` (`scripts/test-evidence.ts`) runs Vitest, then the browser preflight and Playwright (always both tiers, even if the first fails), and writes one merged report to `.vortex-results/junit.xml`. Playwright suites/classnames get the `e2e/` prefix. No browser: E2E is skipped with a one-line message and the exit code reflects Vitest only. Exit is non-zero if any tier that ran failed. `testEvidence.command` now points at it; `junitPath` and `testGlobs` unchanged; CI unchanged.

**Design note:** the orchestration lives in `lib/test-evidence/evidence.ts` (`runEvidence`, dependencies injected) so the four scenarios are unit-tested with fakes; the script only wires real processes and files. This one file is beyond the ticket's listed ownership.

**Files:** `lib/test-evidence/merge-junit.ts`, `lib/test-evidence/evidence.ts`, `scripts/test-evidence.ts` (new); tests `lib/test-evidence/merge-junit.test.ts`, `evidence.test.ts`; `package.json` (`test:evidence` script); `.vortex/config.yaml` (`testEvidence.command` + comment).

**Verified:** real `bun run test:evidence` here (no Chromium): exit 0, 713 Vitest tests in merged report, skip message printed. The browser-present paths were exercised only through fakes, not against real Chromium.
