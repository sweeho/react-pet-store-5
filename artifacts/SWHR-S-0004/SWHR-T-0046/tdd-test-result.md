---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0004
ticket: SWHR-T-0046
branch: vortex/feat/SWHR-T-0046-storefront-screens-sign-in-sign-in-error-84b1d3d7
upstream: [artifacts/SWHR-S-0004/SWHR-T-0046/PLAN.md]
---

# TDD result — SWHR-T-0046

## Test cases

| Test                                                                                                 | Covers                                               | Intent                                                                                                           |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/pages/signin.test.tsx › [SWHR-C-0099] pre-fills the remembered user name…`                      | AC-1 (SWHR-R-0053.01)                                | remembered user name pre-fills, password stays empty, checkbox checked                                           |
| `src/pages/signin.test.tsx › [SWHR-C-0100] leaves the checkbox unchecked…`                           | AC-2 (SWHR-R-0053.02)                                | no remembered name → checkbox unchecked, new-account fields empty                                                |
| `src/pages/signin.test.tsx › [SWHR-C-0101] blocks submission and shows one message per empty field…` | AC-3 (SWHR-R-0053.03)                                | empty-field check blocks submit, one message per empty field, no API call                                        |
| `src/pages/signin.test.tsx › [SWHR-C-0102] submits the user name and password once…`                 | AC-4 (SWHR-R-0053.04)                                | Create New Account posts userId/password once to /api/users                                                      |
| `src/pages/signin-error.test.tsx` (2 cases)                                                          | AC-5 (SWHR-R-0054.01, unit half)                     | not-found message + Try again link back to /signin; ja/zh copy                                                   |
| `src/components/layout/SiteLayout.test.tsx › [SWHR-C-0104] anonymous shopper…`                       | AC-6 (SWHR-R-0055.01)                                | anonymous header: logo/search/Account/Cart/Sign in present, no Sign out                                          |
| `src/components/layout/SiteLayout.test.tsx › [SWHR-C-0105] signed-on shopper…`                       | AC-7 (SWHR-R-0055.02)                                | signed-on header: Sign out present, Sign in absent                                                               |
| `src/components/layout/SiteLayout.test.tsx` (existing PRIMARY_AREAS coverage test, updated)          | AC-6/AC-7                                            | SIGNIN excluded from the generic href-per-area check now that it's session-dependent (SD-6)                      |
| `src/components/ui/input.test.tsx` (6 cases)                                                         | P13 (input primitive)                                | label association, helper text, error state + aria-invalid, typed input, unique generated ids                    |
| `src/components/state/ErrorState.test.tsx` (2 new cases)                                             | DESIGN.md §Forms ("link back to the form")           | `primaryAction` renders as a Link (not onRetry), `secondaryLabel` overrides "Back to Home"                       |
| `src/hooks/useSignOnSession.test.tsx` (4 cases)                                                      | design.md §Interface contracts                       | loads GET /api/session once, `refresh()` re-fetches, failure keeps last known session, throws outside a provider |
| `src/pages/user-creation-error.test.tsx` (2 cases)                                                   | SWHR-R-0057.01 (unit half)                           | in-use message + "Choose another user name" link back to /signin; ja copy                                        |
| `src/pages/signed-out.test.tsx` (2 cases)                                                            | SWHR-R-0073                                          | thanks message + Sign in again (/signon-welcome) + Keep browsing (/); ja copy (SWHR-R-0073.01)                   |
| `src/pages/signon-welcome.test.tsx` (2 cases)                                                        | design.md SD-6 (no mockup, built from shell pattern) | greets signed-on user by id, links onward; zh copy                                                               |
| `src/pages/register.test.tsx` (2 cases)                                                              | design.md P8 (no mockup)                             | preferred-language select defaults to session locale; submits POST /api/customers                                |
| `src/pages/product/[productId].test.tsx` (1 new case, 3 existing)                                    | design.md P9 (cart seam)                             | Add to Cart posts `{itemId}` to /api/cart/items, shows confirmation                                              |
| `src/pages/cart.test.tsx` (3 cases, rewritten from the placeholder)                                  | design.md P9 (cart seam)                             | lists item name/quantity/price from GET /api/cart, empty state, ja copy                                          |

## Red run

Command: the 12 touched/new test files run together —

```
bun --bun vitest run src/components/ui/input.test.tsx src/components/state/ErrorState.test.tsx \
  src/hooks/useSignOnSession.test.tsx src/components/layout/SiteLayout.test.tsx \
  src/pages/signin.test.tsx src/pages/signin-error.test.tsx src/pages/user-creation-error.test.tsx \
  src/pages/signed-out.test.tsx src/pages/signon-welcome.test.tsx src/pages/register.test.tsx \
  "src/pages/product/[productId].test.tsx" src/pages/cart.test.tsx
```

Tests were written/extended first; each new page/component was implemented immediately after its
test in the same working session rather than left as a standing stub, so red was captured
**retroactively but for real**: every implementation file this ticket adds or changes (`input.tsx`,
`useSignOnSession.tsx`, `ErrorState.tsx`, `SiteHeader.tsx`, `GlobalNav.tsx`, `SiteLayout.tsx`, the
nine i18n screen files, and every new/changed page under `src/pages`) was reverted to its
pre-ticket `HEAD` content (new files moved aside, modified files `git checkout`'d) with every test
file left exactly as committed, then the suite above was run against that reverted tree.

Result: **12 failed test files, 8 failed / 13 passed individual tests (21 total ran before the
suite's own file-level failures cut further execution)** — module-resolution errors for every
brand-new page/hook/primitive (`Failed to resolve import "./register"`,
`"@/hooks/useSignOnSession"`, `"./input"`, …) and real assertion failures for every extended file
(`ErrorState`'s `primaryAction` link not found, the header's `[SWHR-C-0104]`/`[SWHR-C-0105]`
Sign-in/Sign-out assertions failing, `ProductPage`'s "Add to Cart" button not found, `CartPage`'s
item/quantity/price text not found). The implementation tree was then fully restored (every backup
file copied/moved back) and reconfirmed byte-identical to the pre-revert state before continuing.

## Green run

`bun run verify` (lint + typecheck + full unit/integration suite, this stack's full pre-commit
gate):

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  97 passed (97)
      Tests  445 passed (445)
```

The same 12 scoped files, standalone, for a direct before/after comparison with the red run above:

```
$ bun --bun vitest run src/components/ui/input.test.tsx src/components/state/ErrorState.test.tsx \
    src/hooks/useSignOnSession.test.tsx src/components/layout/SiteLayout.test.tsx \
    src/pages/signin.test.tsx src/pages/signin-error.test.tsx src/pages/user-creation-error.test.tsx \
    src/pages/signed-out.test.tsx src/pages/signon-welcome.test.tsx src/pages/register.test.tsx \
    "src/pages/product/[productId].test.tsx" src/pages/cart.test.tsx

 Test Files  12 passed (12)
      Tests  46 passed (46)
```

`bun run verify:full` was also run: its E2E preflight (`scripts/ensure-playwright-browser.mjs`)
reports Chromium is not installed in this container (`/ms-playwright/chromium-1155/chrome-linux/chrome`
missing) — the same genuine-absence fallback AGENTS.md documents. Not retried; E2E cases
SWHR-C-0103 and SWHR-C-0106 for this change belong to SWHR-T-0048, which runs against the QA/CI
container's Chromium.

TDD-RESULT: 445 passed, 0 failed
