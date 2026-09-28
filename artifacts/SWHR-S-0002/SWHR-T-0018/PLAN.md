# PLAN — SWHR-T-0018 · Page localization

Change `swhr-i-0003-localization` · tasks.md group 4 · Requirements: _Supported storefront locales_ (every page), _Language switching from every page_ (switch present), _Locale-specific page resolution_. Read `openspec/changes/swhr-i-0003-localization/design.md` first (D3, P3, SD-4, SD-10).

## Objective

Every storefront page renders from per-locale screen definitions with en_US fallback, and the header and mobile drawer switch the language in place.

## Steps

1. `src/i18n/screens.ts`: registry via `import.meta.glob("./screens/*.ts", { eager: true })`; `resolveScreen(screen, locale)` per P3/D3 — requested locale, else `en_US`, else throw `Definition for screen <name> not found`.
2. `src/i18n/screens/<screen>.ts` for every existing storefront page (home, cart, checkout, account, signin, category, search, not-found) plus a `shell` screen for header/nav/footer copy, each with en_US, ja_JP and zh_CN text.
3. `src/i18n/LocaleProvider.tsx` + `useLocale()`: loads `GET /api/locale`; effective locale = `?locale=` query value when parseable, else session locale (never persisted); sets `document.documentElement.lang`; `changeLocale(id)` posts to `/api/locale`, then re-renders the current route (same path, query and state).
4. `useScreen(name)` hook; an unresolved screen renders `ErrorState` with the message (mockup "page definition not found").
5. Wire `main.tsx`/`SiteLayout` with the provider; `SiteHeader` buttons use `en_US`/`ja_JP`/`zh_CN` with `aria-pressed` from the effective locale; add the same three controls to the `GlobalNav` mobile drawer (SD-4); footer "Language" link goes to `/locale` (screen built by SWHR-T-0020).
6. Tests: resolver unit tests (four resolution ACs), header/drawer UI test, `e2e/language-switch.spec.ts` switching on a placeholder page and asserting the same URL in ja_JP.

## Fixed interface contract

```ts
// src/i18n/screens/<name>.ts
export default { en_US: {...}, ja_JP?: {...}, zh_CN?: {...} } satisfies ScreenDefinition;
export type ScreenDefinition = Partial<Record<string, Record<string, string>>> & { en_US?: Record<string, string> };
export function resolveScreen(name: string, locale: LocaleId): Record<string, string>; // throws "Definition for screen <name> not found"
export function useScreen(name: string): Record<string, string>;
export function useLocale(): { locale: LocaleId; changeLocale(id: string): Promise<{ ok: true } | { ok: false; message: string }> };
```

Later tasks add screens by adding a file under `src/i18n/screens/`; they never edit the registry.

## File/module ownership

- `src/i18n/screens.ts`, `src/i18n/screens/*.ts` (initial set), `src/i18n/LocaleProvider.tsx`, `src/i18n/*.test.ts(x)` (new)
- `src/main.tsx`, `src/components/layout/*`, `src/pages/index.tsx`, `src/pages/cart.tsx`, `src/pages/checkout.tsx`, `src/pages/account.tsx`, `src/pages/signin.tsx`, `src/pages/search.tsx`, `src/pages/category/[categoryId].tsx`, `src/pages/NotFound.tsx`, `src/pages/[...all].tsx` and their existing tests
- `e2e/language-switch.spec.ts` (new), existing `e2e/*.spec.ts` only where copy assertions change
- Not admin/supplier pages (SWHR-T-0016 owns admin strings).

## Definition of Done

AC-1 … AC-6 pass (unit/UI for resolution and switch presence, E2E for every page × locale and in-place switch); existing shell tests stay green.

## Design reference

- `artifacts/SWHR-S-0002/design/mockup-language-switch-same-page-re-rendered-in.html` (+ wireframe) — header in ja_JP, pressed state, breadcrumb.
- `artifacts/SWHR-S-0002/design/mockup-page-definition-not-found.html` (+ wireframe) — error frame copy.
