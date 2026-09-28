# PLAN — SWHR-T-0013 · Locale model

Change `swhr-i-0003-localization` · tasks.md group 1 · Requirements: _Supported storefront locales_ (Default locale), _Locale identifier interpretation_. Read `openspec/changes/swhr-i-0003-localization/design.md` first (D1, P1, test-harness phase).

## Objective

One locale model for server and SPA: the supported list, the configurable default, and the single `language_COUNTRY` parser.

## Steps

1. Create `lib/locale/model.ts` (D1, P1) exporting the fixed contract below. The default comes from deployment configuration (env `DEFAULT_LOCALE`, falling back to `en_US`).
2. Parser rules per D1: absent input → `null`; `default` (any case) → the default locale; no `_` → `null`; two parts → `{ language, country }`; three or more parts → `null` (rejected, not guessed).
3. Test harness (design.md "Test-harness phase"): add `lib` to `tsconfig.node.json` include; route `lib/**/*.test.ts` to the Vitest `server` project and exclude it from `client`. Confirm the SPA can import `lib/locale/model.ts` under both `tsc --build` and Vite.
4. `lib/locale/model.test.ts` covers every AC plus the three-part and absent cases.

## Fixed interface contract (peers code against this; do not change)

```ts
export const SUPPORTED_LOCALES: readonly ["en_US", "ja_JP", "zh_CN"];
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type LocaleId = string; // "language_COUNTRY"
export interface ParsedLocale {
  id: LocaleId;
  language: string;
  country: string;
}
export function getDefaultLocale(): LocaleId; // "en_US" unless configured
export function parseLocale(input: string | null | undefined): ParsedLocale | null;
export function isSupportedLocale(id: string): id is SupportedLocale;
```

## File/module ownership

- `lib/locale/model.ts`, `lib/locale/model.test.ts` (new)
- `tsconfig.node.json`, `vitest.config.ts`

## Definition of Done

AC-1 … AC-4 on the ticket pass as unit tests in `lib/locale/model.test.ts`; the app builds with `lib/` in both TypeScript projects.

## Design reference

No screen in this task. Sprint designs: `artifacts/SWHR-S-0002/design/MANIFEST.md`.
