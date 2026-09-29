# Integration test result — SWHR-S-0011

Command: `bun run test:e2e` (playwright test; project chromium; `bunx playwright test --list` reports 64 tests in 13 files)

Summary line: `64 passed (21.3s)`

| Spec                             | Passed | Failed | Skipped |
| -------------------------------- | ------ | ------ | ------- |
| account.spec.ts                  | 4      | 0      | 0       |
| cart.spec.ts                     | 3      | 0      | 0       |
| catalog-anonymous-access.spec.ts | 1      | 0      | 0       |
| catalog-browsing.spec.ts         | 13     | 0      | 0       |
| checkout.spec.ts                 | 2      | 0      | 0       |
| home.spec.ts                     | 2      | 0      | 0       |
| language-switch.spec.ts          | 4      | 0      | 0       |
| locale-selection.spec.ts         | 3      | 0      | 0       |
| personalisation.spec.ts          | 1      | 0      | 0       |
| product-locale.spec.ts           | 1      | 0      | 0       |
| shell.spec.ts                    | 19     | 0      | 0       |
| sign-on.spec.ts                  | 8      | 0      | 0       |
| smoke.spec.ts                    | 3      | 0      | 0       |

No spec file was wholly skipped. No failures.

E2E-RESULT: chromium 64 passed, 0 failed, 0 skipped
