---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0002
ticket: SWHR-T-0017
branch: vortex/feat/SWHR-T-0017-preferred-language-stored-preference-app-7798466b
upstream: [artifacts/SWHR-S-0002/SWHR-T-0017/PLAN.md]
downstream: [artifacts/SWHR-S-0002/qa-test-report.md]
---

# Summary — SWHR-T-0017: Preferred language — stored preference applied at sign-on and profile save

## What changed

Added a `profiles` table (`userId` PK → `users.id`, `preferredLanguage` text, default `en_US`) and `lib/locale/preference.ts`, the seam the sign-on and account capabilities will call (D2, SD-1 — those capabilities don't exist in this sprint): `applyPreferredLanguageOnSignOn(event, userId)` applies the stored profile's preferred language to the session and cart locale, or does nothing when no profile exists yet; `applyPreferredLanguageOnProfileSave(event, preferredLanguage)` does the same for a just-saved preference.

## Files

- `db/schema.ts` — added `profiles` (`userId` PK/FK to `users.id`, `preferredLanguage` not-null default `en_US`).
- `db/client.ts` — registered `profiles` in the drizzle schema map.
- `drizzle/0001_glamorous_supernaut.sql` (+ `drizzle/meta/0001_snapshot.json`, `drizzle/meta/_journal.json`) — generated migration for `profiles`.
- `lib/locale/preference.ts` (new) — `applyPreferredLanguageOnSignOn`, `applyPreferredLanguageOnProfileSave`, per the ticket's fixed interface contract.
- `lib/locale/preference.test.ts` (new) — integration tests for all four ACs against the real (in-memory under Vitest) database and real H3 sessions.

## AC coverage

- AC-1 (Japanese preference at sign-on → session + cart locale `ja_JP`): `lib/locale/preference.test.ts › applyPreferredLanguageOnSignOn › [AC-1]`.
- AC-2 (Profile save with `zh_CN` → session + cart locale `zh_CN`): `lib/locale/preference.test.ts › applyPreferredLanguageOnProfileSave › [AC-2]`.
- AC-3 (Sign-on with no profile → succeeds, locale unchanged): `lib/locale/preference.test.ts › applyPreferredLanguageOnSignOn › [AC-3]`.
- AC-4 (Profile without a language → `en_US`): `lib/locale/preference.test.ts › profiles.preferredLanguage default › [AC-4]`.

## Verification

- `bun run test -- lib/locale/preference` — red with `preference.ts` removed (module not found), green after restoring it (4/4 passed).
- `bun run verify` (lint + `tsc --build` + full unit suite) — 21 test files, 69 tests passed; lint and typecheck clean.
- `bun run db:generate` — generated the `profiles` migration from the schema change; committed the migration + updated meta.

Full detail: `tdd-test-result.md`.

## Notes

`setSessionLocale` (from `lib/locale/session.ts`, SWHR-T-0014) already sets both the session locale and the cart locale together, so both apply functions delegate to it rather than duplicating that logic — no deviation from `PLAN.md`.
