---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0008
idea: SWHR-I-0007
branch: vortex/sprint/swhr-s-0008-ca237af7
downstream: [artifacts/SWHR-S-0008/qa-test-report.md]
---

# Integration test result — SWHR-S-0008

## Commands run

`bun install && bun run build` — exit 0.

`bun run test:e2e` could not run: its preflight (`scripts/ensure-playwright-browser.mjs`) expects Chromium revision 1155 at `/ms-playwright/chromium-1155`, but this container ships revision 1223 (`/ms-playwright/chromium-1223`, `chromium_headless_shell-1223`). Output: "Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome)".

Workaround, no repository file changed: symlink the installed revision under the expected names in a temp directory and point Playwright at it.

```
ln -sfn /ms-playwright/chromium-1223 /tmp/pwb/chromium-1155
ln -sfn /ms-playwright/chromium_headless_shell-1223 /tmp/pwb/chromium_headless_shell-1155
ln -sfn /ms-playwright/ffmpeg-1011 /tmp/pwb/ffmpeg-1011
PLAYWRIGHT_BROWSERS_PATH=/tmp/pwb bunx playwright test --project=chromium
```

`bunx playwright test --list`: 59 tests in 11 files, one project (`chromium`), so `--project=chromium` covers every spec.

Summary line: `59 passed (20.2s)`, exit 0.

## Results

| Spec                                 | Tests | Result  | Notes                                                                                                   |
| ------------------------------------ | ----- | ------- | ------------------------------------------------------------------------------------------------------- |
| e2e/account.spec.ts                  | 4     | 4 pass  | includes SWHR-C-0230, SWHR-C-0231, create-account journey, edit-account journey (city becomes San Jose) |
| e2e/personalisation.spec.ts          | 1     | pass    | My List and pet-tips banner follow the profile preferences                                              |
| e2e/catalog-anonymous-access.spec.ts | 1     | pass    |                                                                                                         |
| e2e/catalog-browsing.spec.ts         | 13    | 13 pass |                                                                                                         |
| e2e/home.spec.ts                     | 2     | 2 pass  |                                                                                                         |
| e2e/language-switch.spec.ts          | 4     | 4 pass  |                                                                                                         |
| e2e/locale-selection.spec.ts         | 3     | 3 pass  |                                                                                                         |
| e2e/product-locale.spec.ts           | 1     | pass    |                                                                                                         |
| e2e/shell.spec.ts                    | 19    | 19 pass |                                                                                                         |
| e2e/sign-on.spec.ts                  | 8     | 8 pass  |                                                                                                         |
| e2e/smoke.spec.ts                    | 3     | 3 pass  |                                                                                                         |

No test skipped; no spec file ran zero tests. Per-spec counts are from `--list` and the run's ✓ lines.

E2E-RESULT: chromium 59 passed, 0 failed, 0 skipped
