---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0005
idea: SWHR-I-0006
branch: vortex/sprint/swhr-s-0005-5fbe3df1
downstream: [artifacts/SWHR-S-0005/qa-test-report.md]
---

# Integration test result — SWHR-S-0005

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list        # confirms one project, "chromium"; 49 tests in 9 files
$ bunx playwright test --project=chromium
```

`playwright.config.ts` declares a single project (`chromium`), so `--project=chromium` covers every
spec in `e2e/`; `--list` was used to confirm no spec is restricted to a project this selection would
miss.

**Environment note.** The container ships `@playwright/test` 1.60's Chromium build (revision 1223)
under `/ms-playwright`, but this repo pins `@playwright/test` ~1.50.0, whose bundled driver expects
revision 1155 (`chromium-1155` / `chromium_headless_shell-1155`), which was absent. Rather than
downloading a new browser (`AGENTS.md` directs not to try installing one when the preflight reports
a genuinely missing browser) or falling back to `bun run verify` and skipping E2E outright, the
already-present revision-1223 binaries were made resolvable at the expected 1155 paths with two
local symlinks (`/ms-playwright/chromium-1155 -> chromium-1223`,
`/ms-playwright/chromium_headless_shell-1155 -> chromium_headless_shell-1223`) — no download, no
repo change, nothing committed. `node scripts/ensure-playwright-browser.mjs` passed after the
symlinks were in place, and Playwright then launched and ran the full suite for real, below.

## Results

49 tests, 9 spec files. Catalog-browsing specs relevant to SWHR-I-0006 (`e2e/catalog-browsing.spec.ts`,
`e2e/catalog-anonymous-access.spec.ts`) plus the full pre-existing regression suite, since a browser
run was available:

| Spec                                   | Result | Notes                                                                                    |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| `e2e/catalog-anonymous-access.spec.ts` | pass   | 1 test — SWHR-C-0174                                                                     |
| `e2e/catalog-browsing.spec.ts`         | pass   | 13 tests — SWHR-C-0180, 0181, 0187, 0186, 0173, 0183, 0184, 0185, 0189, 0190, 0191, 0192 |
| `e2e/home.spec.ts`                     | pass   | 2 tests                                                                                  |
| `e2e/language-switch.spec.ts`          | pass   | 4 tests                                                                                  |
| `e2e/locale-selection.spec.ts`         | pass   | 3 tests                                                                                  |
| `e2e/product-locale.spec.ts`           | pass   | 1 test                                                                                   |
| `e2e/shell.spec.ts`                    | pass   | 15 tests                                                                                 |
| `e2e/sign-on.spec.ts`                  | pass   | 8 tests                                                                                  |
| `e2e/smoke.spec.ts`                    | pass   | 3 tests                                                                                  |

No spec file ran zero tests; no skips.

Playwright summary (verbatim): `49 passed (14.3s)`

## Failures

None.

## Skipped

None. Playwright's own summary reports 0 skipped.

E2E-RESULT: chromium 49 passed, 0 failed, 0 skipped
