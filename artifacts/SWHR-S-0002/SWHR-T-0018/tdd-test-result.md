---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0002
ticket: SWHR-T-0018
branch: vortex/feat/SWHR-T-0018-page-localization-per-locale-screen-cont-5d6970cf
upstream: [artifacts/SWHR-S-0002/SWHR-T-0018/PLAN.md]
---

# TDD result — SWHR-T-0018

## Test cases

| Test                                                                                                                                         | Covers                         | Intent                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/i18n/screens.test.ts › resolveScreen › [AC-3] renders the requested locale's own content`                                               | AC-3                           | a screen with content in the requested locale returns that content                                                                                                                                                                                                                                                |
| `src/i18n/screens.test.ts › resolveScreen › [AC-4] falls back to en_US when no definitions are installed for the effective locale`           | AC-4                           | `de_DE` (never used by any screen) falls back to `en_US`                                                                                                                                                                                                                                                          |
| `src/i18n/screens.test.ts › resolveScreen › [AC-6] throws ScreenNotFoundError stating the screen name when it is defined nowhere`            | AC-6                           | unregistered screen name → `Definition for screen giftcard not found`                                                                                                                                                                                                                                             |
| `src/i18n/screens.test.ts › pickScreenContent › [AC-3] returns the requested locale's content`                                               | AC-3                           | pure fallback rule, requested-locale branch                                                                                                                                                                                                                                                                       |
| `src/i18n/screens.test.ts › pickScreenContent › [AC-5] falls back to en_US when this screen doesn't define the requested locale`             | AC-5                           | a screen that has en_US/ja_JP but not zh_CN falls back to en_US (no real screen in the registry has this gap, so tested directly against a literal object)                                                                                                                                                        |
| `src/i18n/LocaleProvider.test.tsx › starts at the default locale before the session loads, then adopts it`                                   | — (supporting)                 | client-side default before `fetchLocale` resolves                                                                                                                                                                                                                                                                 |
| `src/i18n/LocaleProvider.test.tsx › [AC-3] a parseable ?locale= overrides the session locale without persisting it`                          | AC-3                           | `?locale=ja_JP` wins over the `en_US` session locale; `postLocale` is never called                                                                                                                                                                                                                                |
| `src/i18n/LocaleProvider.test.tsx › an unparseable ?locale= is ignored and the session locale is used`                                       | — (supporting)                 | `?locale=ja` (no separator) does not override                                                                                                                                                                                                                                                                     |
| `src/i18n/LocaleProvider.test.tsx › changeLocale writes through postLocale and updates the effective locale`                                 | — (supporting, SWHR-R-0008)    | switching writes through and updates every consumer                                                                                                                                                                                                                                                               |
| `src/i18n/LocaleProvider.test.tsx › changeLocale surfaces the rejection message and leaves the locale unchanged`                             | — (supporting, SWHR-R-0009)    | a rejected change reports its message and does not change the locale                                                                                                                                                                                                                                              |
| `src/i18n/LocaleProvider.test.tsx › useLocale throws when used outside a LocaleProvider`                                                     | — (supporting)                 | fixed-contract guard                                                                                                                                                                                                                                                                                              |
| `src/i18n/ScreenBoundary.test.tsx › [AC-6] shows the specific message when the screen is defined nowhere`                                    | AC-6                           | the thrown message reaches the DOM inside the shared error frame                                                                                                                                                                                                                                                  |
| `src/i18n/ScreenBoundary.test.tsx › renders children normally when the screen resolves`                                                      | — (supporting)                 | no false-positive catch                                                                                                                                                                                                                                                                                           |
| `src/i18n/ScreenBoundary.test.tsx › re-throws a non-screen error for an outer boundary to handle`                                            | — (supporting)                 | this boundary only owns `ScreenNotFoundError`                                                                                                                                                                                                                                                                     |
| `src/i18n/ScreenBoundary.test.tsx › Try again clears the error and re-mounts the children`                                                   | — (supporting)                 | retry affordance                                                                                                                                                                                                                                                                                                  |
| `src/pages/cart.test.tsx`, `checkout.test.tsx`, `account.test.tsx`, `signin.test.tsx`, `search.test.tsx` (2 tests each)                      | AC-1                           | each placeholder page renders its own en_US content by default and a locale's content for `?locale=`                                                                                                                                                                                                              |
| `src/pages/category/[categoryId].test.tsx` (3 tests)                                                                                         | AC-1, AC-3                     | category label + coming-soon copy per locale; `?locale=` override; localized fallback title for an unknown category                                                                                                                                                                                               |
| `src/pages/index.test.tsx` (updated to wrap with `LocaleProvider`)                                                                           | — (existing, SWHR-C-0003)      | unchanged assertions, now exercised through the locale seam                                                                                                                                                                                                                                                       |
| `src/pages/[...all].test.tsx` (updated to wrap with `LocaleProvider`)                                                                        | — (existing)                   | unchanged assertions, now exercised through the locale seam                                                                                                                                                                                                                                                       |
| `src/components/layout/SiteLayout.test.tsx › [AC-2] offers English, Japanese and Chinese language controls, pressed on the effective locale` | AC-2                           | the three controls are present and reflect the effective locale                                                                                                                                                                                                                                                   |
| `src/components/layout/SiteLayout.test.tsx › [AC-2] offers the same three language controls in the mobile drawer`                            | AC-2                           | SD-4: the drawer carries the same controls the desktop header does                                                                                                                                                                                                                                                |
| `src/components/layout/SiteLayout.test.tsx › switching language re-renders the same page in place, in the new language`                      | — (supporting, SWHR-R-0008.01) | clicking a language control re-renders the current page, not a different route                                                                                                                                                                                                                                    |
| `src/components/layout/SiteLayout.test.tsx › switching language from the mobile drawer closes the drawer and re-renders the page`            | — (regression)                 | CI caught this: the drawer's language buttons didn't close the drawer, so headlessui left the page behind it `aria-hidden` and the E2E assertion on the re-rendered heading timed out. Fixed in `GlobalNav.tsx` by also calling `setMobileOpen(false)`; this test reproduces the failure locally and pins the fix |
| `e2e/language-switch.spec.ts` (4 specs)                                                                                                      | AC-2, AC-3, SWHR-R-0008.01     | same behaviour against a real dev server and session cookie — see Notes (not executed in this container)                                                                                                                                                                                                          |

## Red run

`bun run test`, with every implementation file this ticket adds or changes moved aside via `git stash push -u` (all new/modified test files kept in place):

```
FAIL  |client| src/i18n/screens.test.ts
Error: Failed to resolve import "./screens" from "src/i18n/screens.test.ts". Does the file exist?
FAIL  |client| src/i18n/LocaleProvider.test.tsx
Error: Failed to resolve import "./LocaleProvider" from "src/i18n/LocaleProvider.test.tsx". Does the file exist?
FAIL  |client| src/i18n/ScreenBoundary.test.tsx
Error: Failed to resolve import "./LocaleProvider" from "src/i18n/ScreenBoundary.test.tsx". Does the file exist?
FAIL  |client| src/pages/cart.test.tsx / checkout.test.tsx / account.test.tsx / signin.test.tsx / search.test.tsx
Error: Failed to resolve import "@/i18n/LocaleProvider" ...
FAIL  |client| src/pages/category/[categoryId].test.tsx
Error: Failed to resolve import "@/i18n/LocaleProvider" ...
FAIL  |client| src/pages/index.test.tsx, src/pages/[...all].test.tsx, src/components/layout/SiteLayout.test.tsx
Error: Failed to resolve import "@/i18n/LocaleProvider" ...

 Test Files  12 failed | 17 passed (29)
      Tests  57 passed (57)
```

`git stash pop` restored the implementation immediately after.

## Green run

`bun run verify` — this stack's full pre-commit gate (`bun run lint && bun run typecheck && bun run test`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  29 passed (29)
      Tests  98 passed (98)
```

`bun run verify:full`'s E2E tier could not run in THIS container: `scripts/ensure-playwright-browser.mjs` reports Chromium is not installed ("expected at: /ms-playwright/chromium-1155/chrome-linux/chrome"). Not retried and no browser installed, per workflow rules. `e2e/language-switch.spec.ts` DID run in CI (which carries Chromium) and caught a real bug: the mobile-drawer language buttons didn't close the drawer, so headlessui's Dialog left the page behind it `aria-hidden`, and the "re-renders in place" assertion timed out (`getByRole('heading', { name: '搜索' })` not found). Fixed in `GlobalNav.tsx` (the drawer's language buttons now also call `setMobileOpen(false)`, matching every other drawer link) and pinned locally with a new RTL regression test (`SiteLayout.test.tsx › switching language from the mobile drawer closes the drawer and re-renders the page`) — confirmed it fails without the fix and passes with it. Re-pushed for CI to re-verify. Additionally verified the server itself boots and serves the locale seam correctly: `bun run dev` then `curl localhost:5000/` → 200, `curl localhost:5000/api/locale` → `{"locale":"en_US","cartLocale":"en_US"}`, `curl localhost:5000/cart` → 200.

TDD-RESULT: 98 passed, 0 failed
