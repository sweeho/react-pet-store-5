# SWHR-T-0080 summary

Extended `profiles` (favoriteCategory, myListPreference, bannerPreference; FK moved to `customers` with cascade) and added `accounts`, `contactInfos`, `addresses`, `creditCards` with child-side unique nullable owner FKs, cascading deletes and the account status CHECK. The card keeps only `cardLastFour`.

## Files

- `db/schema.ts`; `drizzle/0006_parched_may_parker.sql`, `drizzle/meta/*`
- `lib/account/schema.test.ts` (new, cases SWHR-C-0194, 0196–0199, 0207)
- `lib/locale/preference.test.ts`: two inserts now create the `customers` row first, because `profiles` now references `customers`. Deviation from PLAN step 5 ("unchanged").

## Deviation

The generated migration selected the new profile columns from the old table; hand-edited to copy only `userId`, `preferredLanguage`. Verified on a database migrated to 0005 holding a user, customer and profile: rows kept, new columns default.

## Verification

`bun run verify` — pass (134 files, 642 tests). Fresh-db migrate runs on every test module. E2E not run (no UI change).
