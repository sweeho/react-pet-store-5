---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0002
ticket: SWHR-T-0018
branch: vortex/feat/SWHR-T-0018-page-localization-per-locale-screen-cont-5d6970cf
upstream: [artifacts/SWHR-S-0002/SWHR-T-0018/PLAN.md]
downstream: [artifacts/SWHR-S-0002/qa-test-report.md]
---

# Summary — SWHR-T-0018: Page localization — per-locale screen content, fallback and header language switch

## What changed

Added a per-screen, per-locale content registry (`src/i18n/screens.ts` + `src/i18n/screens/*.ts`)
with `en_US` fallback and a "not found" error (D3, P3), a client-side `LocaleProvider` that loads
the session locale and applies a non-persisting `?locale=` override (P2/P3), and wired the header,
mobile drawer, footer and every existing storefront page to read their copy from it. The header's
language buttons and a matching set in the mobile drawer now actually call `changeLocale`, re-rendering
the current page in place rather than navigating away.

## Files

- `src/i18n/screens.ts` — registry (`import.meta.glob`), `resolveScreen`, `pickScreenContent`, `useScreen`, `ScreenNotFoundError`.
- `src/i18n/screens/{shell,home,cart,checkout,account,signin,search,category,not-found}.ts` — en_US/ja_JP/zh_CN content for every existing page plus shared chrome.
- `src/i18n/LocaleProvider.tsx` — `LocaleProvider`/`useLocale`; `fetchLocale`/`postLocale` are injectable (mirrors `AsyncContent`'s `load` prop) so tests don't need a real network round trip.
- `src/i18n/ScreenBoundary.tsx` — catches `ScreenNotFoundError` and shows the "page definition not found" frame; re-throws anything else to the outer `RootErrorBoundary`.
- `src/main.tsx` — wraps the app in `LocaleProvider` and `ScreenBoundary`.
- `src/components/layout/{SiteHeader,GlobalNav,SiteFooter}.tsx` — chrome copy from `useScreen("shell")`; header + drawer language controls wired to `useLocale()`; footer gained a "Language" link to `/locale` (SWHR-T-0020's screen).
- `src/pages/{index,cart,checkout,account,signin,search,NotFound}.tsx`, `src/pages/category/[categoryId].tsx` — copy from their own `useScreen(...)` call.
- Existing tests updated to wrap with `LocaleProvider`: `src/pages/index.test.tsx`, `src/pages/[...all].test.tsx`, `src/components/layout/SiteLayout.test.tsx` (also gained the language-switch/drawer test cases).
- New tests: `src/i18n/{screens,LocaleProvider,ScreenBoundary}.test.tsx`, `src/pages/{cart,checkout,account,signin,search}.test.tsx`, `src/pages/category/[categoryId].test.tsx`, `e2e/language-switch.spec.ts`.

## AC coverage

- AC-1 (every page renders content authored for the requested locale): every page's `useScreen()` call, covered per-page in `cart.test.tsx` / `checkout.test.tsx` / `account.test.tsx` / `signin.test.tsx` / `search.test.tsx` / `category/[categoryId].test.tsx`, plus `e2e/language-switch.spec.ts`.
- AC-2 (switch controls present on every page): `SiteHeader.tsx` + `GlobalNav.tsx` drawer, covered by `SiteLayout.test.tsx › [AC-2]` (both) and `e2e/language-switch.spec.ts`.
- AC-3 (request locale overrides session locale, not persisted): `LocaleProvider.tsx`'s `?locale=` handling, covered by `LocaleProvider.test.tsx › [AC-3]`, `category/[categoryId].test.tsx › [AC-3]`, and `e2e/language-switch.spec.ts`.
- AC-4 (locale with no installed definitions → en_US): `screens.ts:resolveScreen`, covered by `screens.test.ts › [AC-4]`.
- AC-5 (page missing in the effective locale → en_US): `screens.ts:pickScreenContent`, covered by `screens.test.ts › [AC-5]` (tested against a literal object — every real screen in this registry has full 3-locale coverage, so none reproduces this gap naturally).
- AC-6 (page defined nowhere → error): `ScreenNotFoundError`, covered by `screens.test.ts › [AC-6]` (resolver) and `ScreenBoundary.test.tsx › [AC-6]` (rendered message).

## Verification

```
$ bun run verify
lint ✓  typecheck ✓
Test Files  29 passed (29)
     Tests  97 passed (97)
```

See `tdd-test-result.md` — `TDD-RESULT: 97 passed, 0 failed`, including the real red run (12 files
failing on missing modules with the implementation stashed aside).

`bun run verify:full`'s E2E tier could not run: `scripts/ensure-playwright-browser.mjs` reports
Chromium is not installed in this container. Not retried, per workflow instructions — Validation
runs `e2e/language-switch.spec.ts` at INTEGRATION_QA / in CI. Manually confirmed the server itself
serves the locale seam correctly: `bun run dev`, then `curl localhost:5000/` → 200,
`curl localhost:5000/api/locale` → `{"locale":"en_US","cartLocale":"en_US"}`, `curl localhost:5000/cart` → 200.

## Notes

- **Registry-level fallback vs. per-screen fallback (AC-4 vs. AC-5).** Both go through the same
  `screen?.[locale] ?? screen?.en_US` code path in `pickScreenContent`. Since every real screen in
  this registry has full en_US/ja_JP/zh_CN coverage (by design — AC-1 requires it), there is no real
  screen that reproduces "this locale is installed generally, but not for this one page" (AC-5). That
  branch is tested directly against a literal `ScreenDefinition` object instead of weakening a real
  screen's translations for test convenience.
- **`LocaleProvider` is mounted in `main.tsx`, not inside `SiteLayout.tsx`.** The ticket's plan named
  both files for this step; keeping the provider at the app root (rather than baked into `SiteLayout`)
  lets tests inject a fake `fetchLocale`/`postLocale` around whatever they render, without adding a
  test-only prop to `SiteLayout`'s public API.
- **Category taxonomy labels (`PET_CATEGORIES`/`PRIMARY_AREAS` in `src/constants/navigation.ts`)
  stay English.** That file is outside this ticket's file ownership (owned elsewhere / catalog
  capability per design SD-2); the mockup's fully-localized catalog nav is out of scope until that
  capability exists. Filed as a follow-up below.
- `useSearchParams` is imported explicitly from `react-router` in `LocaleProvider.tsx` rather than
  relying on the project's auto-import, since `auto-imports.d.ts` is a gitignored, lazily-regenerated
  file and this project's `verify` runs `typecheck` before `test` — an explicit import avoids a
  first-run ordering hazard.
