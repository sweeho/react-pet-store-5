# PLAN — SWHR-T-0087: Migration 0005 fails on an existing database

Change: `swhr-s-0009-bugfix-swhr-t-0087-swhr-t-00` · Requirement: **Schema upgrade preserves existing data** (`database-migrations`)

## Design reference

No design blocks: this bugfix sprint has no idea canvas design.

## Objective

An existing database migrated through 0004 and holding catalogue rows upgrades to the latest schema at startup, keeps every row, and ends with foreign keys enforced. The root cause is in `openspec/changes/swhr-s-0009-bugfix-swhr-t-0087-swhr-t-00/proposal.md` §Why.

## Steps

1. Read `design.md` §Context and D1–D2.
2. Reproduce first: write `lib/db/migrate.test.ts` per D2 so the upgrade case fails against a stub `migrateDatabase`.
3. Implement `migrateDatabase` in `lib/db/migrate.ts` per D1 (fixed signature below).
4. Replace the pragma + `migrate` call in `db/client.ts` with `migrateDatabase`, and correct the SD3 comment's premise (D1).
5. Confirm the existing route and E2E tests that start from a fresh database still pass. Their database is fresh, so they exercise the fresh-database scenario too.

## File/module ownership

- `lib/db/migrate.ts` (new)
- `lib/db/migrate.test.ts` (new)
- `db/client.ts`

Fixed interface: `migrateDatabase(sqlite: Database, migrationsFolder: string): void` (`Database` from `bun:sqlite`). Throws `Error` naming each table reported by `PRAGMA foreign_key_check`; enforcement is ON when it returns or throws. Do NOT edit any file under `drizzle/`.

## Definition of Done

AC-1 … AC-5 of the ticket, each proven by a case in `lib/db/migrate.test.ts`.
