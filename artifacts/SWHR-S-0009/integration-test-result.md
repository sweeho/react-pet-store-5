# Integration test result — SWHR-S-0009

Command: `bun run test:e2e` (runs `playwright test`; the only project is `chromium`; `playwright test --list` shows 59 tests in 11 files). Playwright 1.60.0, preflight `node scripts/ensure-playwright-browser.mjs` exit 0.

Run-summary line, verbatim: `59 passed (27.4s)`. Exit code 0. No skipped tests, and no spec file ran zero tests. A second run through `bun run test:evidence` gave `59 passed (24.5s)`.

| Spec                                 | Passed | Failed | Skipped |
| ------------------------------------ | ------ | ------ | ------- |
| e2e/account.spec.ts                  | 4      | 0      | 0       |
| e2e/catalog-anonymous-access.spec.ts | 1      | 0      | 0       |
| e2e/catalog-browsing.spec.ts         | 13     | 0      | 0       |
| e2e/home.spec.ts                     | 2      | 0      | 0       |
| e2e/language-switch.spec.ts          | 4      | 0      | 0       |
| e2e/locale-selection.spec.ts         | 3      | 0      | 0       |
| e2e/personalisation.spec.ts          | 1      | 0      | 0       |
| e2e/product-locale.spec.ts           | 1      | 0      | 0       |
| e2e/shell.spec.ts                    | 19     | 0      | 0       |
| e2e/sign-on.spec.ts                  | 8      | 0      | 0       |
| e2e/smoke.spec.ts                    | 3      | 0      | 0       |

(Counts from the run's ✓ lines; total 59.) No failures, so no traces or screenshots.

E2E-RESULT: chromium 59 passed, 0 failed, 0 skipped
