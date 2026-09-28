---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0002
idea: SWHR-I-0003
branch: vortex/sprint/swhr-s-0002-a6c70702
downstream: [artifacts/SWHR-S-0002/qa-test-report.md]
---

# Integration test result — SWHR-S-0002

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list          # confirmed single "chromium" project covers all 6 spec files, 28 tests
$ bunx playwright install chromium     # container shipped chromium-1223; this project's @playwright/test ~1.50.0 expects build v1155, which was missing — installed it
$ bun run test:e2e -- --project=chromium
```

## Results

| Spec                           | Result | Notes                                                                 |
| ------------------------------ | ------ | --------------------------------------------------------------------- |
| `e2e/home.spec.ts`             | pass   | 2/2                                                                   |
| `e2e/language-switch.spec.ts`  | pass   | 4/4 — covers SWHR-R-0008.01/.02, SWHR-R-0013.01, mobile drawer switch |
| `e2e/locale-selection.spec.ts` | pass   | 3/3 — covers SWHR-R-0023.01/.02, SWHR-R-0009.01                       |
| `e2e/product-locale.spec.ts`   | pass   | 1/1 — covers SWHR-R-0008.01 on the product page, cart locale move     |
| `e2e/shell.spec.ts`            | pass   | 14/14                                                                 |
| `e2e/smoke.spec.ts`            | pass   | 3/3                                                                   |

Playwright summary: `28 passed (6.9s)`

E2E-RESULT: chromium 28 passed, 0 failed, 0 skipped
