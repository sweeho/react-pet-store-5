---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0002
ticket: SWHR-T-0020
branch: vortex/feat/SWHR-T-0020-locale-selection-screen-choice-list-chan-c949294c
upstream: [artifacts/SWHR-S-0002/SWHR-T-0020/PLAN.md]
---

# TDD result — SWHR-T-0020

## Test cases

| Test                                                                                                                                                           | Covers                | Intent                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/locale/index.test.tsx › LocaleSelection › [AC-1] shows the four-option choice list and a Change Locale control`                                     | AC-1 (SWHR-R-0023.01) | `/locale` renders a radiogroup with US English/German/Japanese/Simplified Chinese and a Change Locale button                                          |
| `src/pages/locale/index.test.tsx › LocaleSelection › [AC-2] submitting Japanese switches the session locale and shows the confirmation screen with ja_JP`      | AC-2 (SWHR-R-0023.02) | Choosing Japanese + Change Locale posts `ja_JP`, then `/locale/changed` shows `ja_JP`                                                                 |
| `src/pages/locale/index.test.tsx › LocaleSelection › a rejected change (a malformed ?requested= link) leaves the session locale unchanged and shows the error` | DoD (SWHR-R-0009.01)  | `/locale?requested=ja` shows "Unable to change language to ja" inline, the still-`en_US` locale is shown, and "Choose a language" returns to the form |
| `src/pages/locale/changed.test.tsx › LocaleChanged › shows the locale now in effect, translated into itself`                                                   | AC-2 (SWHR-R-0023.02) | The confirmation screen shows the effective locale's own name and code, in that locale's own translated content (D3)                                  |
| `src/pages/locale/options.test.ts › LOCALE_CHOICES › lists exactly US English, German, Japanese and Simplified Chinese`                                        | AC-1                  | The choice-list data is exactly the four legacy demo options (D6, Q4, SD-3)                                                                           |
| `src/pages/locale/options.test.ts › labelKeyForLocale › resolves each of the four choices to its own label key`                                                | AC-1/AC-2             | Label lookup used by both screens for the four known codes                                                                                            |
| `src/pages/locale/options.test.ts › labelKeyForLocale › falls back to the US English label for a locale outside the choice list`                               | defensive             | An unrecognised code doesn't crash the label lookup                                                                                                   |

## Red run

`bun run test -- src/pages/locale`

Run with `options.ts`, `index.tsx` and `changed.tsx` temporarily moved out (the test files were written first and already import them):

```
FAIL  |client| src/pages/locale/options.test.ts
Error: Failed to resolve import "./options" from "src/pages/locale/options.test.ts". Does the file exist?

FAIL  |client| src/pages/locale/changed.test.tsx
Error: Failed to resolve import "./changed" from "src/pages/locale/changed.test.tsx". Does the file exist?

FAIL  |client| src/pages/locale/index.test.tsx
Error: Failed to resolve import "./changed" from "src/pages/locale/index.test.tsx". Does the file exist?

 Test Files  3 failed (3)
      Tests  no tests
```

Confirms all three suites run (in the `client`/jsdom Vitest project) and genuinely have no implementation to pass against yet.

## Green run

`bun run verify` (`bun run lint && bun run typecheck && bun run test`) — the project's full pre-commit gate, after restoring the three source files.

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  37 passed (37)
      Tests  122 passed (122)
```

All 37 suites (122 tests, including the 7 new locale-screen cases) pass; lint and `tsc --build` are clean. (One lint fix along the way: dropped a `useEffect` that synchronously called `setSelected` on `locale` changes — `react-hooks/set-state-in-effect` correctly flagged it; the initial `useState(locale)` value is sufficient since no AC depends on re-syncing the pre-selected radio after the session loads.)

**E2E** (`e2e/locale-selection.spec.ts`, 3 specs covering SWHR-R-0023.01, SWHR-R-0023.02 and SWHR-R-0009.01): written and committed, but `bun run test:e2e` was not run here — its own preflight (`scripts/ensure-playwright-browser.mjs`) reports Chromium is genuinely not installed in this container (`/ms-playwright/chromium-1155/chrome-linux/chrome` missing). Per the test-automation gate ladder, this is the "browser genuinely missing" case: fall back to `verify` and let Validation run the E2E tier at INTEGRATION_QA. Not retried, no browser install attempted.

TDD-RESULT: 122 passed, 0 failed
