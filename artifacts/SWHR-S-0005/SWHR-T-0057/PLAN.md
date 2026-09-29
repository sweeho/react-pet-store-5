# SWHR-T-0057 — Catalog data model

Change `swhr-i-0006-catalog-browsing-and-search`, tasks.md group 1. Read `openspec/changes/swhr-i-0006-catalog-browsing-and-search/design.md` first, including "Sprint planning — SWHR-S-0005".

## Objective

The catalog tables reject what the spec says they must reject and carry the five item attributes, so later tickets can build on a schema that matches the spec.

## Design reference

No UI. Design exports for the sprint are in `artifacts/SWHR-S-0005/design/` (index `MANIFEST.md`); none apply here.

## Steps

1. `db/schema.ts`: add nullable `attr1`…`attr5` text columns to `itemDetails` (SD2). Keep `name`.
2. Add `CHECK (length(...) <= n)` constraints: ids ≤ 10 (category, product, item), details names ≤ 80, category description and image ≤ 255, item description ≤ 255, attributes ≤ 80 (SD4).
3. `db/client.ts`: run `PRAGMA foreign_keys = ON` on the connection before `migrate` (SD3). This is the only change to that file.
4. Generate the migration (the `db-generate` slot) and commit `drizzle/0005_*.sql` plus `drizzle/meta/`. SQLite cannot add a CHECK to an existing table; accept drizzle-kit's table-rebuild output and confirm existing rows survive.
5. `lib/catalog/schema.test.ts` (server project): one test per AC, inserting directly through `db`. For AC-4 store 1850/1200 and assert the formatted en_US values read `18.50`/`12.00` via `lib/locale/money.ts` (no float arithmetic on the stored value).
6. Run the whole unit suite. Where an existing test fails only because a fixture inserts a child row without its parent (e.g. a cart line for a non-existent item), fix the fixture, not the pragma.

## File/module ownership

- `db/schema.ts` — catalog tables only
- `db/client.ts` — the pragma line only
- `drizzle/0005_*.sql`, `drizzle/meta/*` — generated
- `lib/catalog/schema.test.ts` — new
- existing test files, fixture fixes only, where FK enforcement breaks them

## Interface contracts (fixed)

- `itemDetails` gains `attr1`…`attr5: text | null`. No column is renamed or removed; `listPrice`/`unitCost` stay integer minor units.
- Foreign keys are enforced for the whole database from this ticket on.

## Definition of Done

AC-1 … AC-5 on the ticket, each proven by a named test in `lib/catalog/schema.test.ts`; the migration is committed and applies on a fresh database; the full gate is green.
