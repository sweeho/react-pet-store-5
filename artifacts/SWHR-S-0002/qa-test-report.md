---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0002
idea: SWHR-I-0003
branch: vortex/sprint/swhr-s-0002-a6c70702
upstream:
  [
    artifacts/SWHR-S-0002/SPRINT-PLAN.md,
    artifacts/SWHR-S-0002/integration-test-result.md,
    artifacts/SWHR-S-0002/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0002/sprint-summary.md]
---

# QA test report — SWHR-S-0002

**Note on section count:** this report's structure follows SWHR-T-0021's acceptance criteria, which require EXACTLY these 7 `##` sections (no `## Design fidelity` section). The `artifact-qa-test-report` skill's canonical structure names 8 sections including `## Design fidelity`; the ticket AC is more specific to this run and is followed literally. Design-fidelity findings are folded into `## Code Review` below instead of a standalone section.

## Executive Summary

**Verdict: PASS.** All 8 tickets of SWHR-I-0003 (Locale model, Session locale, Orders/emails, Forms/encoding/admin strings, Preferred language, Page localization, Catalog and prices, Locale selection screen) are merged into the sprint branch and `openspec/changes/swhr-i-0003-localization/tasks.md` is fully checked off. Verified all 23 requirements / 35 scenarios in the delta spec (`openspec/changes/swhr-i-0003-localization/specs/localization/spec.md`) against the integrated build: every scenario passes (see the `SCENARIO-VERDICT:` lines below). The core gate (`bun run verify`: lint + typecheck + 151 unit tests) and the full Playwright E2E suite (28/28) both pass on the first run. No defects were found; `integration-defects-resolution.md` is empty and `COMPLETE`.

## E2E Test Status

Executed. `28 passed, 0 failed, 0 skipped`. Full command, per-spec table and Playwright's verbatim summary are in `artifacts/SWHR-S-0002/integration-test-result.md`.

## Unit Test Results

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  42 passed (42)
      Tests  151 passed (151)
   Duration  4.63s
```

Lint and typecheck both exited 0 with no reported issues.

### Scenario verdicts — `openspec/changes/swhr-i-0003-localization/specs/localization/spec.md`

Each scenario was exercised against the integrated build via its cited automated test (unit, integration or E2E — all executed and passing per the runs above and in `integration-test-result.md`).

```
SCENARIO-VERDICT: Supported storefront locales / Every page exists in every supported locale — pass
SCENARIO-VERDICT: Supported storefront locales / Default locale — pass
SCENARIO-VERDICT: Default session locale / New visitor receives the default locale — pass
SCENARIO-VERDICT: Default session locale / Existing session locale is preserved — pass
SCENARIO-VERDICT: Locale identifier interpretation / Two-part identifier — pass
SCENARIO-VERDICT: Locale identifier interpretation / The literal default — pass
SCENARIO-VERDICT: Locale identifier interpretation / Identifier without a separator — pass
SCENARIO-VERDICT: Language switching from every page / Switching language on a product page — pass
SCENARIO-VERDICT: Language switching from every page / Switch available on every page — pass
SCENARIO-VERDICT: Rejected locale change / Unparseable locale code — pass
SCENARIO-VERDICT: Locale change reaches server-side business state / Business operation after a switch — pass
SCENARIO-VERDICT: Preferred language applied at sign-on and profile save / Customer with a Japanese preference signs on — pass
SCENARIO-VERDICT: Preferred language applied at sign-on and profile save / Preference changed in the profile — pass
SCENARIO-VERDICT: Preferred language applied at sign-on and profile save / New account without a profile — pass
SCENARIO-VERDICT: Customer preferred language / Profile created without a language — pass
SCENARIO-VERDICT: Locale-specific page resolution / Request locale overrides session locale — pass
SCENARIO-VERDICT: Locale-specific page resolution / Locale with no installed definitions — pass
SCENARIO-VERDICT: Locale-specific page resolution / Page missing in the effective locale — pass
SCENARIO-VERDICT: Locale-specific page resolution / Page defined nowhere — pass
SCENARIO-VERDICT: Locale-specific catalog content / Item shown in the requested locale — pass
SCENARIO-VERDICT: Locale-specific catalog content / No details in the requested locale — pass
SCENARIO-VERDICT: Locale-specific catalog content / Item whose product lacks the locale — pass
SCENARIO-VERDICT: Locale-specific price display / Same item viewed in two locales — pass
SCENARIO-VERDICT: Shopping cart locale / Cart before any locale is set — pass
SCENARIO-VERDICT: Purchase order locale / Order submitted without a locale — pass
SCENARIO-VERDICT: Localized customer emails / Japanese order — pass
SCENARIO-VERDICT: Localized customer emails / Unresolvable order locale — pass
SCENARIO-VERDICT: Localized customer emails / Locale with no template — pass
SCENARIO-VERDICT: Email price formats / Price in an English email — pass
SCENARIO-VERDICT: Email price formats / Price in a Japanese email — pass
SCENARIO-VERDICT: Locale-specific state and province options / Japanese order form — pass
SCENARIO-VERDICT: UTF-8 request and response encoding / Japanese text on account creation — pass
SCENARIO-VERDICT: Administrator client string catalogue / German administrator — pass
SCENARIO-VERDICT: Locale selection screen / Locale selection screen is displayed — pass
SCENARIO-VERDICT: Locale selection screen / A locale is chosen and submitted — pass
```

Traceability for each, by requirement:

| Requirement | Evidence                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| SWHR-R-0005 | `src/i18n/screens/*.ts` — all 11 screens export `en_US`/`ja_JP`/`zh_CN`; `lib/locale/model.test.ts` [AC-1]                               |
| SWHR-R-0006 | `routes/api/locale.test.ts` [AC-1]/[AC-2]; `lib/locale/session.test.ts` [AC-1]/[AC-2]                                                    |
| SWHR-R-0007 | `lib/locale/model.test.ts` [AC-2]/[AC-3]/[AC-4] + three-part-identifier case                                                             |
| SWHR-R-0008 | `e2e/language-switch.spec.ts`, `e2e/product-locale.spec.ts`; switch rendered in `SiteHeader.tsx` + `GlobalNav.tsx` (mobile drawer, SD-4) |
| SWHR-R-0009 | `routes/api/locale.test.ts` [AC-3]; `e2e/locale-selection.spec.ts` `[SWHR-R-0009.01]`                                                    |
| SWHR-R-0010 | `routes/api/locale.test.ts` [AC-4]                                                                                                       |
| SWHR-R-0011 | `lib/locale/preference.test.ts` [AC-1]/[AC-2]/[AC-3]                                                                                     |
| SWHR-R-0012 | `lib/locale/preference.test.ts` [AC-4]                                                                                                   |
| SWHR-R-0013 | `src/i18n/screens.test.ts` [AC-3]/[AC-4]/[AC-5]/[AC-6]; `e2e/language-switch.spec.ts` `[SWHR-R-0013.01]`                                 |
| SWHR-R-0014 | `lib/catalog/queries.test.ts` [AC-2]/[AC-3]/[AC-4]                                                                                       |
| SWHR-R-0015 | `lib/catalog/queries.test.ts` [AC-5]; `lib/locale/money.test.ts` [AC-5]                                                                  |
| SWHR-R-0016 | `lib/catalog/cart.test.ts` [AC-6]                                                                                                        |
| SWHR-R-0017 | `lib/orders/locale.test.ts` [AC-1]                                                                                                       |
| SWHR-R-0018 | `lib/email/render.test.ts` [AC-2]/[AC-3]/[AC-4]                                                                                          |
| SWHR-R-0019 | `lib/email/render.test.ts` [AC-5]/[AC-6]; `lib/email/price.test.ts` [AC-5]/[AC-6]                                                        |
| SWHR-R-0020 | `lib/locale/stateProvince.test.ts` [AC-1]; `src/components/forms/StateProvinceSelect.test.tsx` [AC-1]                                    |
| SWHR-R-0021 | `routes/api/users/index.post.test.ts` [AC-2] (SD-7: verified through the demo `users` resource, per design)                              |
| SWHR-R-0022 | `src/pages/admin/index.test.tsx` [AC-3]                                                                                                  |
| SWHR-R-0023 | `e2e/locale-selection.spec.ts` `[SWHR-R-0023.01]`/`[SWHR-R-0023.02]`; `src/pages/locale/index.test.tsx`                                  |

No `SPEC-GAP` findings — every scenario in the delta spec has a covering, passing test.

## Code Review

No notable concerns observed. The implementation follows `design.md`'s decisions (D1–D7) closely: one shared locale parser (`lib/locale/model.ts`), a server-authoritative session locale (`middleware/locale.ts` + `lib/locale/session.ts`), strict per-locale catalog isolation with no fallback (`lib/catalog/queries.ts`), and email template selection matching D5/Q2/Q3 exactly (`lib/email/render.ts`). Legacy defects (Q3: email generation fails rather than falling back; Q4: German offered in the selection screen; SD-9: `zh_CN` e-mail price kept in the dollar pattern) were carried forward as specified, not silently "fixed" — matching the design's intent to keep open questions explicit rather than making an unreviewed product call.

**Design fidelity (advisory — informs but does not change the verdict):** compared the built locale selection screen (`src/pages/locale/index.tsx`) against `artifacts/SWHR-S-0002/design/mockup-locale-selection.html`. The four-option radiogroup (US English, German, Japanese, Simplified Chinese), the "Currently in effect" locale readout, and the "Change Locale" submit control all match the mockup's copy and structure. Screen copy for the title ("Change language" / "言語の変更" / "更改语言") and the "Change Locale" control label match the mockup's per-locale strings verbatim. No material deviation observed in this spot check; a full pixel-level comparison across all 6 mockups was not performed.

## Coverage Summary

No coverage tool is declared in `package.json` or `vitest.config.ts` (no `coverage` script, no `vitest --coverage` configuration) — this is `Not Applicable`, not a gap introduced by this sprint; the project has never run one. Verified instead by inspection: every module under `lib/locale/`, `lib/catalog/`, `lib/email/`, `lib/orders/` and every locale-facing route/page has a co-located `*.test.ts`/`*.test.tsx` file (`lib/**/*.test.ts` run in the Vitest `server` project, `src/**/*.test.tsx` in `client`), and all 151 tests pass per `## Unit Test Results`.

## Issues Found

None. `artifacts/SWHR-S-0002/integration-defects-resolution.md` is empty and marked `INTEGRATION_DEFECTS_RESOLUTION: COMPLETE`.

## Recommendation

**Proceed.** Every acceptance criterion and every spec scenario for SWHR-I-0003 passes on the integrated sprint branch, with no defects found. Firing `validation.all_acs_passed`.
