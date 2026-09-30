---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0016
idea: SWHR-I-0013
branch: vortex/sprint/swhr-s-0016-6b959966
downstream: [artifacts/SWHR-S-0016/qa-test-report.md]
---

# Integration test result — SWHR-S-0016

## Commands run

```
bun install
bun run build            # exit 0
bunx playwright test --list   # Total: 74 tests in 16 files (all in project chromium)
bun run test:e2e
```

Playwright summary: `74 passed (28.9s)`, exit 0, no skipped line.

## Results

| Spec                                 | Passed | Failed | Skipped |
| ------------------------------------ | ------ | ------ | ------- |
| e2e/account.spec.ts                  | 4      | 0      | 0       |
| e2e/cart.spec.ts                     | 3      | 0      | 0       |
| e2e/catalog-anonymous-access.spec.ts | 1      | 0      | 0       |
| e2e/catalog-browsing.spec.ts         | 13     | 0      | 0       |
| e2e/checkout.spec.ts                 | 2      | 0      | 0       |
| e2e/home.spec.ts                     | 2      | 0      | 0       |
| e2e/language-switch.spec.ts          | 4      | 0      | 0       |
| e2e/locale-selection.spec.ts         | 3      | 0      | 0       |
| e2e/order-approval.spec.ts           | 5      | 0      | 0       |
| e2e/order-fulfillment.spec.ts        | 1      | 0      | 0       |
| e2e/personalisation.spec.ts          | 1      | 0      | 0       |
| e2e/product-locale.spec.ts           | 1      | 0      | 0       |
| e2e/shell.spec.ts                    | 19     | 0      | 0       |
| e2e/sign-on.spec.ts                  | 8      | 0      | 0       |
| e2e/smoke.spec.ts                    | 3      | 0      | 0       |
| e2e/supplier-inventory.spec.ts       | 4      | 0      | 0       |

Counts come from the per-test lines of the run log. This sprint adds no UI, so no spec covers the e-mails; the order-approval and order-fulfillment specs pass with the notification plugins loaded.

E2E-RESULT: chromium 74 passed, 0 failed, 0 skipped
