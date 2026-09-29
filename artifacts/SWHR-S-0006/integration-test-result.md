---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0006
idea: Not Applicable
branch: vortex/sprint/swhr-s-0006-c8ce8a09
downstream: [artifacts/SWHR-S-0006/qa-test-report.md]
---

# Integration test result — SWHR-S-0006

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --project=chromium --list   # confirms 1 project ("chromium"), 54 tests, 9 spec files
$ bun run test:e2e -- --project=chromium
```

`install` and `build` both completed successfully (real output in `qa-test-report.md` § E2E Test
Status / Unit Test Results). The `--list` run confirms `--project=chromium` alone covers every spec
under `e2e/` — the config declares exactly one Playwright project, so no additional `--project` flag
is needed.

## Results

The E2E run did not execute — see Failures. No spec produced a pass or fail result.

## Failures

`bun run test:e2e -- --project=chromium` → exit code 1, failing in the `pretest:e2e` preflight
(`scripts/ensure-playwright-browser.mjs`), before Playwright itself started:

```
$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).

E2E tests need a real browser. Either:
  - install it:  bun x playwright install chromium
  - or skip E2E here — in the agent workflow, E2E runs in the QA phase
    (browser-equipped container) and in CI, not in engineer containers.
    Use `bun run verify` (lint + typecheck + test) instead.
error: script "pretest:e2e" exited with code 1
```

Root cause (verified by inspection, not a code change from this sprint): the repo pins
`"@playwright/test": "~1.50.0"` (installed: `1.50.1`), whose browser registry requires Chromium
revision `1155`. This container's `/ms-playwright` only has revision `1223` (`chromium-1223`),
matching Playwright `1.60.0` (confirmed via a cached `bunx playwright@1.60.0`'s own
`browsers.json`, and the container's `VORTEX_PLAYWRIGHT_VERSION=1.60.0` env var). No revision-1155
Chromium exists anywhere on this container (`find / -iname "chromium-1155*"` → no results), and
`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` is set, which blocks downloading it. This is a container/repo
version-pin mismatch, not a defect in any of this sprint's three tickets — none of SWHR-T-0023,
-T-0050 or -T-0064 touches `@playwright/test`'s pinned version (`git log -- package.json` shows only
SWHR-T-0050's `dev` script line), and the equivalent run for SWHR-S-0005 (previous sprint, same repo)
completed with `49 passed, 0 failed, 0 skipped` (`artifacts/SWHR-S-0005/integration-test-result.md`),
confirming this is new environment drift, not a standing repo defect.

Per this repo's own `AGENTS.md`: "`verify` alone is the browser-free core gate. It is the right
fallback **only** when the E2E preflight tells you the browser is genuinely missing: say so in your
summary and move on. Do not retry E2E, and do not try to install a browser." That is exactly this
case — the preflight (`ensure-playwright-browser.mjs`) fails fast with the message above, so per
that guidance no install or retry was attempted. `bun run verify` (lint + typecheck + unit) was run
instead and is reported in full in `qa-test-report.md`.

A follow-up DEFECT (devops, not linked to this sprint) was filed for the version-pin mismatch itself
— see `qa-test-report.md` § Issues Found.

## Skipped

Every spec file under `e2e/` — none of the suite's 54 tests across 9 files executed, because the
`pretest:e2e` preflight failed before Playwright could start:

| Spec file                              | Tests | Reason                                                         |
| -------------------------------------- | ----- | -------------------------------------------------------------- |
| `e2e/catalog-anonymous-access.spec.ts` | 1     | Chromium revision unavailable in this container (see Failures) |
| `e2e/catalog-browsing.spec.ts`         | 13    | Chromium revision unavailable in this container (see Failures) |
| `e2e/home.spec.ts`                     | 2     | Chromium revision unavailable in this container (see Failures) |
| `e2e/language-switch.spec.ts`          | 4     | Chromium revision unavailable in this container (see Failures) |
| `e2e/locale-selection.spec.ts`         | 3     | Chromium revision unavailable in this container (see Failures) |
| `e2e/product-locale.spec.ts`           | 1     | Chromium revision unavailable in this container (see Failures) |
| `e2e/shell.spec.ts`                    | 19    | Chromium revision unavailable in this container (see Failures) |
| `e2e/sign-on.spec.ts`                  | 8     | Chromium revision unavailable in this container (see Failures) |
| `e2e/smoke.spec.ts`                    | 3     | Chromium revision unavailable in this container (see Failures) |

This is reported as fully skipped, not silently passed — per this file's own evidence discipline, a
spec file that ran none of its tests is an outage in the suite, never a pass. It genuinely cannot run
in this environment: no Chromium build compatible with this repo's pinned `@playwright/test` exists
anywhere on this container, and downloading one is blocked (`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`).

E2E-RESULT: not applicable
