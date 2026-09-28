# PLAN — SWHR-T-0020 · Locale selection screen

Change `swhr-i-0003-localization` · tasks.md group 8 · Requirement: _Locale selection screen_ (and the UI of _Rejected locale change_). Read `openspec/changes/swhr-i-0003-localization/design.md` first (D6 last bullet, Q4, SD-3).

## Objective

A `/locale` screen with the four-option choice list and Change Locale, a `/locale/changed` confirmation, and the rejected-change error screen.

## Steps

1. `src/pages/locale/index.tsx` + `src/i18n/screens/locale.ts` (all three locales): `<select name="locale">` US English `en_US`, German `de_DE`, Japanese `ja_JP`, Simplified Chinese `zh_CN`; "Currently in effect"; submit "Change Locale" calls `useLocale().changeLocale`.
2. Success → navigate to `/locale/changed` (`src/pages/locale/changed.tsx` + `src/i18n/screens/locale-changed.ts`) showing the locale in effect.
3. Failure (e.g. `/locale?requested=ja` or a rejected submission) → rejected screen per mockup: "Unable to change language to <id>", locale unchanged.
4. UI tests plus `e2e/locale-selection.spec.ts`: display, submit ja_JP → confirmation shows `ja_JP`, rejected leaves `en_US`.

## Fixed interface contract

Routes `/locale` and `/locale/changed` (the footer "Language" link from SWHR-T-0018 targets `/locale`). Uses `useLocale()` unchanged.

## File/module ownership

- `src/pages/locale/**`, `src/i18n/screens/locale.ts`, `src/i18n/screens/locale-changed.ts` and tests (new)
- `e2e/locale-selection.spec.ts` (new)

## Definition of Done

AC-1 and AC-2 pass (UI + E2E); a rejected submission leaves the session locale `en_US`.

## Design reference

- `artifacts/SWHR-S-0002/design/mockup-locale-selection.html` (+ wireframe)
- `artifacts/SWHR-S-0002/design/mockup-locale-change-confirmation.html` (+ wireframe)
- `artifacts/SWHR-S-0002/design/mockup-language-change-rejected.html` (+ wireframe)
