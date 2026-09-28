---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0001
ticket: SWHR-T-0006
branch: vortex/feat/SWHR-T-0006-site-shell-shared-layout-with-header-glo-961b8c7b
upstream: [artifacts/SWHR-S-0001/SWHR-T-0006/PLAN.md]
---

# TDD result — SWHR-T-0006

`a2a_get_test_cases(SWHR-T-0006)` returned no linked case — the platform-approved cases
SWHR-C-0004/0005/0006/0007/0008 (`openspec/changes/.../test-cases.md`) are not formally
linked to this ticket, so this follows the standard (non-linked) TDD flow. Test titles still
carry the case ids they cover for traceability.

## Test cases

| Test                                                                                                                                                                 | Covers           | Intent                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/layout/SiteLayout.test.tsx › [SWHR-C-0007] renders header, Global nav and footer exactly once, with the page content inside main, in that DOM order` | AC-3             | banner/nav/main/contentinfo each appear once, in header→nav→main→footer DOM order, with a child page body inside main                          |
| `src/components/layout/SiteLayout.test.tsx › [SWHR-C-0005] clicking the Global nav's Home link from a non-root route renders the landing page`                       | AC-2, AC-4       | the nav's home link has href '/' and clicking it from `/cart` renders the landing page                                                         |
| `src/components/layout/SiteLayout.test.tsx › the Global nav contains a link with href '/' and one link per PRIMARY_AREAS and PET_CATEGORIES entry`                   | AC-4             | full link coverage inside the single "Global" nav landmark, mirroring the pattern `src/pages/index.test.tsx` already uses for the landing page |
| `src/components/layout/SiteLayout.test.tsx › opens the mobile menu panel and closes it again`                                                                        | AC-6             | the "Open menu" button mounts a `role="dialog"` panel with a category link and a working "Close menu" button; unmounted before/after           |
| `e2e/shell.spec.ts › [SWHR-C-0004][SWHR-C-0008] the shell renders on <route>` (13 routes: `/` + every PRIMARY_AREAS href)                                            | AC-1, AC-3, AC-4 | banner, Global nav (with a link to '/'), main and footer are all visible on every primary route                                                |
| `e2e/shell.spec.ts › [SWHR-C-0006][SWHR-C-0008] the shell, including the Global navigation, renders on the not-found page`                                           | AC-1, AC-3, AC-4 | same landmarks visible on `/does-not-exist`                                                                                                    |
| `e2e/shell.spec.ts › the navigation folds behind a menu button below the lg breakpoint, and the panel opens and closes`                                              | AC-6             | at a 375px viewport, "Open menu" opens the dialog panel (with a "Birds" link) and "Close menu" dismisses it                                    |

## Red run

`bun run test -- src/components/layout` against the test file alone, with the four
implementation files (`SiteLayout.tsx`, `GlobalNav.tsx`, `SiteHeader.tsx`, `SiteFooter.tsx`,
`index.ts`) moved out of the tree:

```
FAIL  |client| src/components/layout/SiteLayout.test.tsx [ src/components/layout/SiteLayout.test.tsx ]
Error: Failed to resolve import "./SiteLayout" from "src/components/layout/SiteLayout.test.tsx".
Does the file exist?
 Test Files  1 failed (1)
      Tests  no tests
```

This is the standard net-new-component red (the module the tests exercise did not exist
yet), not an assertion failure — there is no prior `SiteLayout` implementation to assert
against. Restoring the four files and re-running turned all 4 tests green with no other
change, confirming the tests actually exercise the real components.

`e2e/shell.spec.ts` has no meaningful red state to capture locally: this container's
Chromium (`/ms-playwright/chromium-1223`) doesn't match this project's pinned Playwright
1.50.1 (expects `chromium-1155`), so `bun run test:e2e`'s preflight refuses to run rather
than downloading a browser (documented, expected — see `## Notes`). It is unexecuted here
in both phases; CI runs it (pinned correctly) and reported pass — see `summary.md`.

## Green run

`bun run verify` — this stack's full pre-commit gate (`bun run lint && bun run typecheck &&
bun run test`).

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
 Test Files  9 passed (9)
      Tests  24 passed (24)
```

`bun run build` also ran clean (`tsc --build && vite build`, exit 0), and `node
scripts/check-doc-links.mjs` reported all relative links resolve (unaffected by this
ticket, checked as part of the full gate this project runs in CI).

TDD-RESULT: 24 passed, 0 failed
