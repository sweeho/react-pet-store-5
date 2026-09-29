---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0014
idea: SWHR-I-0011
branch: vortex/sprint/swhr-s-0014-c83c7c4f
downstream: [artifacts/SWHR-S-0014/qa-test-report.md]
---

# Integration test result — SWHR-S-0014

## Commands run

`bun install`, `bun run build` (exit 0), `bunx playwright test --list` (70 tests in 15 files, single `chromium` project), then `bun run test:e2e` (exit 0).

Playwright summary: `70 passed (25.5s)`

## Results

| Spec                             | Result    | Notes               |
| -------------------------------- | --------- | ------------------- |
| account.spec.ts                  | 4 passed  | 0 failed, 0 skipped |
| cart.spec.ts                     | 3 passed  | 0 failed, 0 skipped |
| catalog-anonymous-access.spec.ts | 1 passed  | 0 failed, 0 skipped |
| catalog-browsing.spec.ts         | 13 passed | 0 failed, 0 skipped |
| checkout.spec.ts                 | 2 passed  | 0 failed, 0 skipped |
| home.spec.ts                     | 2 passed  | 0 failed, 0 skipped |
| language-switch.spec.ts          | 4 passed  | 0 failed, 0 skipped |
| locale-selection.spec.ts         | 3 passed  | 0 failed, 0 skipped |
| order-approval.spec.ts           | 5 passed  | 0 failed, 0 skipped |
| order-fulfillment.spec.ts        | 1 passed  | 0 failed, 0 skipped |
| personalisation.spec.ts          | 1 passed  | 0 failed, 0 skipped |
| product-locale.spec.ts           | 1 passed  | 0 failed, 0 skipped |
| shell.spec.ts                    | 19 passed | 0 failed, 0 skipped |
| sign-on.spec.ts                  | 8 passed  | 0 failed, 0 skipped |
| smoke.spec.ts                    | 3 passed  | 0 failed, 0 skipped |

The sprint's spec is `order-fulfillment.spec.ts`: `[SWHR-C-0340] an approved order flows to the supplier and is invoiced back to COMPLETED` passed (6.1s).

E2E-RESULT: chromium 70 passed, 0 failed, 0 skipped
