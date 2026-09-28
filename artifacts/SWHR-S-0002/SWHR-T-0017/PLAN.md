# PLAN — SWHR-T-0017 · Preferred language

Change `swhr-i-0003-localization` · tasks.md group 3 · Requirements: _Preferred language applied at sign-on and profile save_, _Customer preferred language_. Read `openspec/changes/swhr-i-0003-localization/design.md` first (D2 sign-on bullet, SD-1).

## Objective

Store a customer's preferred language (default en_US) and apply it to session and cart at sign-on and profile save, through functions the sign-on and account changes will call.

## Steps

1. `db/schema.ts`: add `profiles` (`userId` integer PK → `users.id`, `preferredLanguage` text not null default `'en_US'`). Generate and commit the migration in `drizzle/`.
2. `lib/locale/preference.ts`: `applyPreferredLanguageOnSignOn(event, userId)` — profile found → `setSessionLocale(event, profile.preferredLanguage)`; no profile → return without error and without touching the session. `applyPreferredLanguageOnProfileSave(event, preferredLanguage)` → `setSessionLocale`.
3. `lib/locale/preference.test.ts`: the four ACs, including a profile inserted without a language reading back `en_US`.

## Fixed interface contract

```ts
export function applyPreferredLanguageOnSignOn(event: H3Event, userId: number): Promise<void>;
export function applyPreferredLanguageOnProfileSave(
  event: H3Event,
  preferredLanguage: LocaleId,
): Promise<void>;
// db/schema.ts: export const profiles = sqliteTable("profiles", { userId, preferredLanguage })
```

## File/module ownership

- `db/schema.ts`, `drizzle/` (new migration + meta)
- `lib/locale/preference.ts`, `lib/locale/preference.test.ts` (new)

## Definition of Done

AC-1 … AC-4 pass as integration tests against the in-memory database.

## Design reference

No screen in this task. Sprint designs: `artifacts/SWHR-S-0002/design/MANIFEST.md`.
