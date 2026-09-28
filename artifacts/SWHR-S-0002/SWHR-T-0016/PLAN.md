# PLAN — SWHR-T-0016 · Forms, encoding and admin strings

Change `swhr-i-0003-localization` · tasks.md group 7 · Requirements: _Locale-specific state and province options_, _UTF-8 request and response encoding_, _Administrator client string catalogue_. Read `openspec/changes/swhr-i-0003-localization/design.md` first (D6, SD-5, SD-7).

## Objective

Per-locale state/province options for the future order form, a proven UTF-8 round-trip, and an English/German admin string catalogue.

## Steps

1. `lib/locale/stateProvince.ts` `getStateProvinceOptions(locale)`: en_US California, New York, Texas; ja_JP 東京 (Tokyo), 大阪 (Osaka), 長野 (Nagano); zh_CN 北京, 上海, 江苏; unsupported → en_US list. `src/components/forms/StateProvinceSelect.tsx` renders it for a given locale (checkout will place it).
2. `routes/api/users/index.post.ts` (SD-7): create a user from a JSON body; round-trip test submits Japanese and Chinese names and reads them back through `GET /api/users/:id` byte-identical, with a UTF-8 `Content-Type` on the response.
3. `src/i18n/admin/en.ts` and `de.ts` (labels, tooltips, mnemonics as `accessKey`); `useAdminStrings()` chooses by `navigator.language` (`de*` → German, else English); apply to `src/pages/admin/index.tsx`.
4. Tests: options per locale, UTF-8 round-trip integration test, admin page UI test with a German browser language.

## Fixed interface contract

```ts
export function getStateProvinceOptions(locale: LocaleId): { value: string; label: string }[];
export function StateProvinceSelect(props: {
  locale: LocaleId;
  name: string;
  value?: string;
  onChange?: (v: string) => void;
}): JSX.Element;
export function useAdminStrings(): AdminStrings; // { [key]: { label: string; tooltip?: string; mnemonic?: string } }
// POST /api/users { name, email } -> 201 { id, name, email }
```

## File/module ownership

- `lib/locale/stateProvince.ts` + test, `src/components/forms/StateProvinceSelect.tsx` + test (new)
- `routes/api/users/index.post.ts` + test (new)
- `src/i18n/admin/*` (new), `src/pages/admin/index.tsx` + test

## Definition of Done

AC-1 … AC-3 pass.

## Design reference

State/province lists: `artifacts/SWHR-S-0002/design/mockup-locale-specific-prices-and-state-provinc.html` (+ wireframe).
