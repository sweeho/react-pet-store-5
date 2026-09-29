# Fix note — SWHR-T-0087

## Root cause

`db/client.ts` set `PRAGMA foreign_keys = ON` before drizzle's `migrate()`. The migrator runs all pending migrations in one transaction, where SQLite ignores the migration files' own `PRAGMA foreign_keys=OFF`. Migration 0005 rebuilds `category` with `DROP TABLE` while `product` rows reference it, so any populated pre-0005 database failed with `FOREIGN KEY constraint failed`.

## Fix

New `migrateDatabase(sqlite, migrationsFolder)`: enforcement OFF, run `migrate`, enforcement ON (in `finally`), then `PRAGMA foreign_key_check`; any row throws an `Error` naming each offending table. `db/client.ts` calls it instead of the pragma + `migrate`, with the SD3 comment's premise corrected. No file under `drizzle/` changed.

## Files touched

- `lib/db/migrate.ts` (new)
- `lib/db/migrate.test.ts` (new, cases SWHR-C-0448..0452)
- `db/client.ts`
