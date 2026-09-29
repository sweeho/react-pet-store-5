---
artifact: integration-test-result
sprint: SWHR-S-0012
ticket: SWHR-T-0126
author: validation
---

# Integration test result — SWHR-S-0012

Command: `bun run test:e2e` (Playwright, chromium, build served on :5178)

Run summary (verbatim): `69 passed (25.3s)`, exit 0, 0 failed, 0 skipped.

| Spec                                 | Passed |
| ------------------------------------ | ------ |
| e2e/account.spec.ts                  | 4      |
| e2e/cart.spec.ts                     | 3      |
| e2e/catalog-anonymous-access.spec.ts | 1      |
| e2e/catalog-browsing.spec.ts         | 13     |
| e2e/checkout.spec.ts                 | 2      |
| e2e/home.spec.ts                     | 2      |
| e2e/language-switch.spec.ts          | 4      |
| e2e/locale-selection.spec.ts         | 3      |
| e2e/order-approval.spec.ts           | 5      |
| e2e/personalisation.spec.ts          | 1      |
| e2e/product-locale.spec.ts           | 1      |
| e2e/shell.spec.ts                    | 19     |
| e2e/sign-on.spec.ts                  | 8      |
| e2e/smoke.spec.ts                    | 3      |

No failures; every spec file ran its tests.

E2E-RESULT: chromium 69 passed, 0 failed, 0 skipped
