---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0004
idea: SWHR-I-0005
branch: vortex/sprint/swhr-s-0004-cb2d4596
downstream: [artifacts/SWHR-S-0004/qa-test-report.md]
---

# Integration test result — SWHR-S-0004

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list          # confirmed a single "chromium" project covers every spec (playwright.config.ts declares only that project)
$ bunx playwright install chromium     # browser was not preinstalled in this container; installed it (this container is the QA/E2E-mandated one)
$ bun run test:e2e --project=chromium
```

`playwright.config.ts` declares exactly one project (`chromium`), so `--project=chromium` already selects every spec under `e2e/` — no spec is restricted to a second/mobile project.

## Results

Playwright summary: `36 passed (12.7s)`

| Spec                                     | Result | Notes                                                               |
| ---------------------------------------- | ------ | ------------------------------------------------------------------- |
| `e2e/home.spec.ts` (2 tests)             | pass   | landing page, category links                                        |
| `e2e/language-switch.spec.ts` (4 tests)  | pass   | locale switch incl. mobile drawer                                   |
| `e2e/locale-selection.spec.ts` (3 tests) | pass   | locale choice screen                                                |
| `e2e/product-locale.spec.ts` (1 test)    | pass   | product-page language switch                                        |
| `e2e/shell.spec.ts` (14 tests)           | pass   | shell renders on every route incl. `/signin`, `/admin`, `/supplier` |
| `e2e/sign-on.spec.ts` (8 tests)          | pass   | all 8 sign-on/staff e2e journeys — see below                        |
| `e2e/smoke.spec.ts` (3 tests)            | pass   | no console errors, API and DB-backed route respond                  |

`e2e/sign-on.spec.ts` detail (this ticket's subject):

| Test                                                                | Case id     | Result |
| ------------------------------------------------------------------- | ----------- | ------ |
| unknown user 'ghost' shown Sign-in Error, stays signed out          | SWHR-C-0103 | pass   |
| header search for 'dog' opens search results                        | SWHR-C-0106 | pass   |
| gated shopper signing on as alice returned to account page          | SWHR-C-0117 | pass   |
| anonymous shopper adds an item to cart without sign-on              | SWHR-C-0130 | pass   |
| registration from checkout signs on as dave, returns to order info  | SWHR-C-0132 | pass   |
| first-time visitor signs up from sign-in screen, can purchase       | SWHR-C-0134 | pass   |
| sign out in Japanese with 3 cart items, signed-out page, empty cart | SWHR-C-0135 | pass   |
| administrator-group member admin_member signing in sees console     | SWHR-C-0140 | pass   |

No spec file was wholly skipped; no test skipped.

E2E-RESULT: chromium 36 passed, 0 failed, 0 skipped
