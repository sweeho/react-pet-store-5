# SWHR-T-0151 — Initial stock load

`seedInventory` is replaced by `loadInitialStock(db, { force }?)` returning `"loaded" | "skipped"`. Unforced it skips when any stock row exists; forced it upserts EST-1..EST-29 to 10000 and leaves other items alone. `db/client.ts` now just calls it unforced. No route calls it; the function comment records why (R1).

Files: `db/seed/inventory.ts`, `db/client.ts`, `lib/db/inventorySeed.test.ts`.
AC: the three scenarios are covered by SWHR-C-0401/0402/0403; the interface AC is met (grep of `routes/` finds no caller).
Verification: `bun run verify` exit 0, 968 tests passed. `a2a_run_tests` did not respond, so no platform red/green run was recorded.
