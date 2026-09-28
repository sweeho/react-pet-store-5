---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0002
ticket: SWHR-T-0020
branch: vortex/feat/SWHR-T-0020-locale-selection-screen-choice-list-chan-c949294c
upstream: [artifacts/SWHR-S-0002/SWHR-T-0020/PLAN.md]
downstream: [artifacts/SWHR-S-0002/qa-test-report.md]
---

# Summary — SWHR-T-0020: Locale selection screen — choice list, Change Locale and confirmation

## What changed

Built the `/locale` selection screen (choice list of US English/German/Japanese/Simplified Chinese + Change Locale control), the `/locale/changed` confirmation showing the locale now in effect, and the inline rejected-change error state, per the three mockups (D6, Q4, SD-3). Consulted `mockup-locale-selection.html`, `mockup-locale-change-confirmation.html` and `mockup-language-change-rejected.html` before writing any markup.

## Files

- `src/pages/locale/index.tsx` (new) — the `/locale` page: the choice list, Change Locale submit, and the inline rejected state (also reachable via a `?requested=` link, mirroring the legacy `changelocale.do?locale=` demo path).
- `src/pages/locale/changed.tsx` (new) — the `/locale/changed` confirmation page.
- `src/pages/locale/options.ts` (new) — the shared four-choice list data and the locale→label-key lookup both pages use.
- `src/i18n/screens/locale.ts`, `src/i18n/screens/locale-changed.ts` (new) — screen content for all three storefront locales.
- `src/pages/locale/index.test.tsx`, `src/pages/locale/changed.test.tsx`, `src/pages/locale/options.test.ts` (new) — UI and unit tests.
- `e2e/locale-selection.spec.ts` (new) — display, submit-Japanese-then-confirm, and rejected-leaves-en_US, against a real dev server.

## AC coverage

- AC-1 (choice list shows US English, German, Japanese, Simplified Chinese + Change Locale): `src/pages/locale/index.test.tsx › [AC-1]`.
- AC-2 (choosing Japanese switches the session locale to `ja_JP` and shows the confirmation): `src/pages/locale/index.test.tsx › [AC-2]` and `src/pages/locale/changed.test.tsx`.
- DoD (a rejected change leaves the session locale `en_US`): `src/pages/locale/index.test.tsx › "a rejected change..."`, exercised via `/locale?requested=ja` since none of the four choice-list options can themselves fail `parseLocale`.

## Verification

- `bun run test -- src/pages/locale` — red with the three source files moved out (module not found), green after restoring them (7/7 passed).
- `bun run verify` (lint + `tsc --build` + full unit suite) — 37 test files, 122 tests passed; lint and typecheck clean.
- `bun run test:e2e -- e2e/locale-selection.spec.ts` — **not run**: its preflight (`scripts/ensure-playwright-browser.mjs`) reports Chromium is genuinely not installed in this container. Per the test-automation gate ladder this is the documented "browser missing" fallback: the spec is written and committed; Validation runs the E2E tier at INTEGRATION_QA.

Full detail: `tdd-test-result.md`.

## Notes

- **Deviation from PLAN.md step 1 (minor, no contract change):** the plan named a native `<select name="locale">`. Built instead as a `role="radiogroup"` of `role="radio"` buttons, mirroring the existing `StateProvinceSelect` pattern (`src/components/forms/StateProvinceSelect.tsx`) — a bordered box of rows with the selected one highlighted, matching the mockup's visual list far more closely than a native select can (a native `<option>` can't carry the mockup's right-aligned mono locale code per row). The fixed interface contract (routes `/locale`, `/locale/changed`, `useLocale()` unchanged) is untouched; updating `PLAN.md` on this branch to reflect the actual widget per the deviation protocol.
- The rejected state is inline on `/locale` (no separate route), since PLAN step 3 gives `/locale?requested=ja` as the way to reach it — none of the four choice-list options can themselves produce an unparseable identifier.
