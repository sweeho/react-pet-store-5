# TDD result — SWHR-T-0064

Regression test: `src/utils/stubSentinelHygiene.test.ts`.

## Red run

With `.vortex/config.yaml` and the 13 `artifacts/**/tdd-test-result.md` files reverted to
their pre-fix state (`git stash` of the fix), ran:

`bun --bun vitest run src/utils/stubSentinelHygiene.test.ts`

```
 FAIL  |client| src/utils/stubSentinelHygiene.test.ts > stub sentinel hygiene > keeps .vortex/config.yaml free of the literal sentinel while it still decodes to the sentinel
AssertionError: expected 'testEvidence:\n  command: bun run …' not to contain the configured stub sentinel
 ❯ src/utils/stubSentinelHygiene.test.ts:35:21

 FAIL  |client| src/utils/stubSentinelHygiene.test.ts > stub sentinel hygiene > keeps every merged artifacts/**/tdd-test-result.md free of the literal sentinel
AssertionError: expected [ …(13) ] to deeply equal []
- Expected
+ Received
- []
+ [
+   "/workspace/repo/artifacts/SWHR-S-0004/SWHR-T-0045/tdd-test-result.md",
+   "/workspace/repo/artifacts/SWHR-S-0004/SWHR-T-0043/tdd-test-result.md",
+   "/workspace/repo/artifacts/SWHR-S-0004/SWHR-T-0044/tdd-test-result.md",
+   "/workspace/repo/artifacts/SWHR-S-0004/SWHR-T-0047/tdd-test-result.md",
+   "/workspace/repo/artifacts/SWHR-S-0004/SWHR-T-0042/tdd-test-result.md",
+   "/workspace/repo/artifacts/SWHR-S-0003/SWHR-T-0032/tdd-test-result.md",
+   "/workspace/repo/artifacts/SWHR-S-0003/SWHR-T-0029/tdd-test-result.md",
+   "/workspace/repo/artifacts/SWHR-S-0003/SWHR-T-0031/tdd-test-result.md",
+   "/workspace/repo/artifacts/SWHR-S-0003/SWHR-T-0033/tdd-test-result.md",
+   "/workspace/repo/artifacts/SWHR-S-0003/SWHR-T-0030/tdd-test-result.md",
+   "/workspace/repo/artifacts/SWHR-S-0003/SWHR-T-0028/tdd-test-result.md",
+   "/workspace/repo/artifacts/SWHR-S-0005/SWHR-T-0059/tdd-test-result.md",
+   "/workspace/repo/artifacts/SWHR-S-0005/SWHR-T-0061/tdd-test-result.md",
+ ]

 Test Files  1 failed (1)
      Tests  2 failed (2)
```

Both cases fail on a real assertion (not an import/stub error) and reproduce the exact 13
offending files design.md's re-verified context names — a real red, single execution, no
flake.

## Green run

With the fix restored (`git stash pop`), ran the same command:

`bun --bun vitest run src/utils/stubSentinelHygiene.test.ts`

```
 Test Files  1 passed (1)
      Tests  2 passed (2)
   Duration  276ms
```

Then the full repo gate, `bun run verify` (lint + typecheck + unit/integration — includes
this new test, 619 total):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(clean)
$ tsc --build
(clean)
$ NODE_ENV=test bun --bun vitest run
 Test Files  128 passed (128)
      Tests  619 passed (619)
```

`bun run verify:full` (adds Playwright E2E) fails in this container only at the
`pretest:e2e` step — Chromium isn't installed here (`ensure-playwright-browser.mjs`
reports it explicitly and instructs against retrying). Per AGENTS.md this falls back to
`bun run verify`, run above and green.
