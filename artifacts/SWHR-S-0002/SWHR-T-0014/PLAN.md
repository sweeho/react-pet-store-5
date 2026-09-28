# PLAN — SWHR-T-0014 · Session locale

Change `swhr-i-0003-localization` · tasks.md group 2 · Requirements: _Default session locale_, _Rejected locale change_, _Locale change reaches server-side business state_ (and the cart-locale half of _Language switching from every page_). Read `openspec/changes/swhr-i-0003-localization/design.md` first (D2, P2, P5).

## Objective

A server-held session locale every request can read, with a validated change endpoint that also moves the cart locale.

## Steps

1. `lib/locale/session.ts`: wrap H3 `useSession` (sealed cookie; password from env `SESSION_PASSWORD`, a dev-only fallback when unset outside production). Session data `{ locale?: string; cartLocale?: string }`.
2. `middleware/locale.ts` (P2): when the session has no locale, write `getDefaultLocale()`; set `event.context.locale` before the handler runs. Never overwrite an existing locale.
3. `routes/api/locale.get.ts` returns `{ locale, cartLocale }`.
4. `routes/api/locale.post.ts` reads `locale` from the JSON body; `parseLocale` null → HTTP 400 with message `Unable to change language to <input>` and no session write; otherwise write `locale` and `cartLocale` (D2, tasks 2.3–2.4).
5. Integration tests with real H3 events (copy `routes/api/hello.test.ts`): default assignment, preserved ja_JP, successful change to zh_CN then a handler reading `event.context.locale`, rejected `ja`.

## Fixed interface contract

```ts
// lib/locale/session.ts
export function getSessionLocale(event: H3Event): Promise<LocaleId>;
export function setSessionLocale(event: H3Event, locale: LocaleId): Promise<void>; // also sets cartLocale
export function getCartLocale(event: H3Event): Promise<LocaleId>; // en_US when unset
// event.context.locale: LocaleId  (set by middleware/locale.ts)
// GET  /api/locale  -> 200 { locale: string, cartLocale: string }
// POST /api/locale  { locale: string } -> 200 { locale } | 400 { message: "Unable to change language to <input>" }
```

## File/module ownership

- `lib/locale/session.ts`, `lib/locale/session.test.ts` (new)
- `middleware/locale.ts` (new)
- `routes/api/locale.get.ts`, `routes/api/locale.post.ts`, `routes/api/locale.test.ts` (new)

## Definition of Done

AC-1 … AC-4 pass as integration tests; the rejected change leaves both `locale` and `cartLocale` untouched.

## Design reference

The error copy for AC-3 is what `artifacts/SWHR-S-0002/design/mockup-language-change-rejected.html` shows (screen itself built in SWHR-T-0020).
