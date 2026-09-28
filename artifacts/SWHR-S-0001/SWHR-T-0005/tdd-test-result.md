---
ticket: SWHR-T-0005
type: tdd-test-result
---

# TDD result — SWHR-T-0005

## Test cases

- `src/pages/index.test.tsx` — `[SWHR-C-0003] links to every primary area` / `[SWHR-C-0003] links to every pet category`: renders `Home` in a `MemoryRouter` at `/` and asserts the rendered link hrefs are a superset of `PRIMARY_AREAS` and `PET_CATEGORIES` from `src/constants/navigation.ts`.
- `src/pages/index.test.tsx` — `renders the hero heading`: asserts the `h1` "Find your next pet" is present.
- `e2e/home.spec.ts` — `[SWHR-C-0002] root URL renders the landing page`: navigates to `/`, asserts the `h1` is visible and the URL is still `/`.
- `e2e/home.spec.ts` — `links to every pet category`: asserts a "Browse <Category>" link exists per category.

## Red run

Command: `bun --bun vitest run src/pages/index.test.tsx`, run against the new test file with the **old** (template) `src/pages/index.tsx` still in place (verified by stashing the rewritten page, running, then restoring it — see below).

```
FAIL  |client| src/pages/index.test.tsx > Home page > renders the hero heading
FAIL  |client| src/pages/index.test.tsx > Home page > [SWHR-C-0003] links to every primary area
  AssertionError: expected [ '#', '#', '#', ... ] to include '/category/BIRDS'
FAIL  |client| src/pages/index.test.tsx > Home page > [SWHR-C-0003] links to every pet category
  AssertionError: expected [ '#', '#', '#', ... ] to include '/category/BIRDS'

 Test Files  1 failed (1)
      Tests  3 failed (3)
```

Reproduced by `git stash push -- src/pages/index.tsx` (keeping the new test), running, observing the 3 failures above, then `git stash pop` to restore the new page implementation.

## Green run

Command (full pre-commit gate, per `AGENTS.md` → `verify`): `bun run verify` (= `bun run lint && bun run typecheck && bun run test`)

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(clean)
$ tsc --build
(clean)
$ NODE_ENV=test bun --bun vitest run

 Test Files  8 passed (8)
      Tests  20 passed (20)
```

`bun run verify:full` was attempted (adds the E2E tier); its preflight (`scripts/ensure-playwright-browser.mjs`) reports Chromium is genuinely not installed in this container (`/ms-playwright/chromium-1155/chrome-linux/chrome` missing), and instructs falling back to `bun run verify` in an engineer container — E2E runs in the QA phase / CI instead. Per that guidance, `e2e/home.spec.ts` was rewritten and reviewed but not executed here; `bun run verify` (browser-free) is the gate this run is graded on.

TDD-RESULT: 20 passed, 0 failed
