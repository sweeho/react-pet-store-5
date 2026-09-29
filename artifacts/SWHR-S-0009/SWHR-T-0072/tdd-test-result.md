# TDD result — SWHR-T-0072

Regression test: `src/test/playwrightBrowserRevision.test.ts` (cites SWHR-C-0453, SWHR-C-0454).

- RED (before bump, 1.50.1, revision 1155): `bun run test src/test/playwrightBrowserRevision` → 2 failed (2); platform red run recorded, both cases `assertion_failure`.
- GREEN (after bump, 1.60.0, revision 1223): same command → Test Files 1 passed, Tests 2 passed. `bun run typecheck` and `bun run lint` exit 0.
- E2E browser run not possible in this container (no Chromium installed); left to QA/CI.
