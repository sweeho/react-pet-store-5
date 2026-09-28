---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0003
idea: SWHR-I-0004
branch: vortex/sprint/swhr-s-0003-6b5b7d75
downstream: [artifacts/SWHR-S-0003/qa-test-report.md]
---

# Integration test result — SWHR-S-0003

SWHR-I-0004 (Partner document exchange) has no screens and adds no Playwright specs — per
`SPRINT-PLAN.md`'s Phase table: "There is no screen, so no Playwright spec is added. Validation's
E2E run at integration QA covers the storefront regression suite unchanged." The run below is that
unchanged regression suite, executed against the integrated sprint branch to confirm no regression.

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list        # confirms all 28 specs are in the single `chromium` project
$ bunx playwright test --project=chromium
```

## Results

| Spec                                     | Result | Notes                                     |
| ---------------------------------------- | ------ | ----------------------------------------- |
| `e2e/home.spec.ts` (2 tests)             | pass   | landing page, category links              |
| `e2e/language-switch.spec.ts` (3 tests)  | pass   | locale switch behaviour                   |
| `e2e/locale-selection.spec.ts` (3 tests) | pass   | locale choice page                        |
| `e2e/product-locale.spec.ts` (1 test)    | pass   | product page locale switch                |
| `e2e/shell.spec.ts` (13 tests)           | pass   | site shell across routes, 404, mobile nav |
| `e2e/smoke.spec.ts` (3 tests)            | pass   | console errors, API, DB-backed route      |

Playwright summary: `28 passed (6.6s)`

No spec file was skipped or ran zero of its tests.

## Failures

None.

## Skipped

None.

E2E-RESULT: chromium 28 passed, 0 failed, 0 skipped
