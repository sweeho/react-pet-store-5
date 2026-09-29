---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0007
idea: Not Applicable
branch: vortex/sprint/swhr-s-0007-01ffeb9c
upstream: [artifacts/SWHR-S-0007/SPRINT-PLAN.md]
---

# Integration test result — SWHR-S-0007

The sprint changes no web UI (a unit-level hygiene test and one documentation line). Playwright could not be executed in this container: it pins Chromium build 1155, but only build 1223 is installed under `/ms-playwright`.

## Commands run

```
$ bun install                                  # exit 0
$ bun run build                                # exit 0
$ bun run test:e2e -- --project=chromium       # exit 1, preflight: Chromium not installed (expected /ms-playwright/chromium-1155/chrome-linux/chrome)
$ bunx playwright test --project=chromium      # exit 1, e2e/global-setup.ts:15 chromium.launch(): Executable doesn't exist at /ms-playwright/chromium_headless_shell-1155/chrome-linux/headless_shell
```

No spec ran, so there is no per-spec table and no passed/failed count. This is the same environment fault as SWHR-S-0006 (follow-up SWHR-T-0072); it is outside this repo's code and no sprint acceptance criterion depends on a browser. The sprint's scenarios were verified by the unit suite (see `qa-test-report.md`).

E2E-RESULT: not applicable
