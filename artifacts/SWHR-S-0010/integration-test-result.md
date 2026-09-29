# Integration test result — SWHR-S-0010

Command: `bun run test:e2e` (runs `playwright test`; only project is `chromium`; `playwright test --list` shows `Total: 62 tests in 12 files`). Build first: `bun run build` exit 0.

Run-summary line, verbatim: `62 passed (20.4s)`. Exit code 0. No skipped tests; no spec file ran zero tests.

| Spec                                 | Passed | Failed | Skipped |
| ------------------------------------ | ------ | ------ | ------- |
| e2e/account.spec.ts                  | 4      | 0      | 0       |
| e2e/cart.spec.ts                     | 3      | 0      | 0       |
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

(Counts from the run's ✓ lines; total 62.) No failures, so no traces or screenshots.

E2E-RESULT: chromium 62 passed, 0 failed, 0 skipped
