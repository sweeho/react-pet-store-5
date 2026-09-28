---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0001
idea: SWHR-I-0002
branch: vortex/sprint/swhr-s-0001-144fcba5
downstream: [artifacts/SWHR-S-0001/qa-test-report.md]
---

# Integration test result — SWHR-S-0001

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list          # confirms selection: one project (chromium) covers all specs
$ bunx playwright test --project=chromium
```

Playwright's config (`playwright.config.ts`) declares a single project, `chromium`, so
`--project=chromium` covers every spec under `e2e/` — `bunx playwright test --list` confirmed
20 tests across 3 files, all under that one project.

The first run of the E2E command failed before any test executed: `browserType.launch: Executable
doesn't exist at /ms-playwright/chromium_headless_shell-1155/chrome-linux/headless_shell`. The
container's pre-installed browser was build 1223; this project's pinned `@playwright/test@~1.50.0`
requires build 1155. Resolved by running `bunx playwright install chromium`, which downloaded build
1155 (166.6 MiB + 101.6 MiB) successfully. This is an environment/tooling mismatch, not a defect in
the sprint's code — no DEFECT filed; see `integration-defects-resolution.md`.

## Results

| Spec                                                                                   | Result | Notes |
| -------------------------------------------------------------------------------------- | ------ | ----- |
| `e2e/home.spec.ts` › `[SWHR-C-0002] root URL renders the landing page`                 | pass   | 600ms |
| `e2e/home.spec.ts` › `links to every pet category`                                     | pass   | 607ms |
| `e2e/shell.spec.ts` › shell renders on `/`                                             | pass   | 613ms |
| `e2e/shell.spec.ts` › shell renders on `/category/BIRDS`                               | pass   | 519ms |
| `e2e/shell.spec.ts` › shell renders on `/category/CATS`                                | pass   | 409ms |
| `e2e/shell.spec.ts` › shell renders on `/category/DOGS`                                | pass   | 499ms |
| `e2e/shell.spec.ts` › shell renders on `/category/FISH`                                | pass   | 507ms |
| `e2e/shell.spec.ts` › shell renders on `/category/REPTILES`                            | pass   | 606ms |
| `e2e/shell.spec.ts` › shell renders on `/search`                                       | pass   | 478ms |
| `e2e/shell.spec.ts` › shell renders on `/cart`                                         | pass   | 481ms |
| `e2e/shell.spec.ts` › shell renders on `/checkout`                                     | pass   | 567ms |
| `e2e/shell.spec.ts` › shell renders on `/account`                                      | pass   | 474ms |
| `e2e/shell.spec.ts` › shell renders on `/signin`                                       | pass   | 486ms |
| `e2e/shell.spec.ts` › shell renders on `/admin`                                        | pass   | 411ms |
| `e2e/shell.spec.ts` › shell renders on `/supplier`                                     | pass   | 490ms |
| `e2e/shell.spec.ts` › `[SWHR-C-0006][SWHR-C-0008]` shell renders on the not-found page | pass   | 508ms |
| `e2e/shell.spec.ts` › mobile menu folds behind a button, opens and closes              | pass   | 512ms |
| `e2e/smoke.spec.ts` › home page loads with no console errors                           | pass   | 411ms |
| `e2e/smoke.spec.ts` › the API responds                                                 | pass   | 316ms |
| `e2e/smoke.spec.ts` › a database-backed route responds                                 | pass   | 343ms |

Playwright summary: `20 passed (4.6s)`

No spec file was wholly skipped; no failures.

E2E-RESULT: chromium 20 passed, 0 failed, 0 skipped
