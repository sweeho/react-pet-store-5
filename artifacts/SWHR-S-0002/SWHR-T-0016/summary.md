---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0002
ticket: SWHR-T-0016
branch: vortex/feat/SWHR-T-0016-forms-encoding-and-admin-strings-state-p-8e61d92d
upstream: [artifacts/SWHR-S-0002/SWHR-T-0016/PLAN.md]
---

# Summary — SWHR-T-0016: Forms, encoding and admin strings

## What changed

Three independent server/UI seams (design D6, SD-5, SD-7), none of which build a page of their own yet:

- **State/province options** (SWHR-R-0020): `lib/locale/stateProvince.ts` maps each supported locale to its three choices (labels in the page's own script — Japanese/Chinese characters, not romanized); an unsupported locale falls back to the en_US list. `src/components/forms/StateProvinceSelect.tsx` renders them as a controlled radio-listbox (`name`/`value`/`onChange`), styled per the design tokens the mockup uses (`line-2` border, `primary-50`/`primary-700` for the selected row) — the order form itself is a later ticket (SWHR-T-0019+), so this component isn't placed on any page yet.
- **UTF-8 round-trip** (SWHR-R-0021, SD-7): `routes/api/users/index.post.ts` adds the missing `POST /api/users`, the only account-shaped write path in the repo. No encoding filter was needed — H3/Nitro decode request bodies as UTF-8 by default (design D6); the ticket's job was proving it, not building one.
- **Admin string catalogue** (SWHR-R-0022, SD-5): `src/i18n/admin/{en,de}.ts` (label/tooltip/mnemonic per key) and `useAdminStrings()`, which chooses by `navigator.language` (`de*` → German, else English — the SPA's analogue of the legacy Swing client's JVM-default locale). Wired into the one existing admin page, `src/pages/admin/index.tsx`.

## Files

- `lib/locale/stateProvince.ts` + `.test.ts` (new) — `getStateProvinceOptions(locale)`.
- `src/components/forms/StateProvinceSelect.tsx` + `.test.tsx` (new) — the controlled listbox.
- `routes/api/users/index.post.ts` + `.test.ts` (new) — `POST /api/users`.
- `src/i18n/admin/{types,en,de,useAdminStrings}.ts` (new) — the catalogue and its selector.
- `src/pages/admin/index.tsx` (modified) — heading (with tooltip/mnemonic) and empty-state text now come from `useAdminStrings()` instead of hardcoded English.
- `src/pages/admin/index.test.tsx` (new) — English-default and German-browser-language cases.

## AC coverage

- AC-1 (Japanese order form offers Tokyo/Osaka/Nagano): `lib/locale/stateProvince.test.ts` and `src/components/forms/StateProvinceSelect.test.tsx`, `[AC-1]` cases.
- AC-2 (Japanese name round-trips identical through account creation): `routes/api/users/index.post.test.ts › [AC-2]` (plus an unlabelled Chinese-name case for the same requirement).
- AC-3 (German administrator sees the German catalogue): `src/pages/admin/index.test.tsx › [AC-3]`.

## Verification

- Red: all four new/changed test files run against their implementation files removed (and `src/pages/admin/index.tsx` reverted to its placeholder) — three suites fail on unresolved imports, the admin suite's new `[AC-3]` case fails on the actual assertion.
- Green: `bun run verify` (lint + `tsc --build` + full unit suite) — 24 test files, 78 tests passed; lint and typecheck clean.
- `bun run verify:full`'s E2E tier was not run: this container has no Chromium installed. None of this ticket's three seams has a page of its own yet (the state/province select and the admin catalogue are consumed by later tickets), so there's no new E2E surface to cover; Validation re-runs the E2E tier at INTEGRATION_QA in a browser-equipped container.

Full detail: `tdd-test-result.md`.

## Notes

No deviation from `PLAN.md`'s fixed interface contract. One scope note: the design reference mockup (`mockup-locale-specific-prices-and-state-provinc.html`) shows the state/province listbox inside a three-column product-comparison card that this ticket does not build (that page belongs to catalog/checkout tickets) — `StateProvinceSelect` reproduces the listbox's visual language (border, selected-row highlight) as a standalone, reusable control per the ticket's fixed interface, not the surrounding card.
