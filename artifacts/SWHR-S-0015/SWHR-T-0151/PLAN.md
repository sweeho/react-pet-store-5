# PLAN — SWHR-T-0151: Initial stock load (task group 5)

Change: `swhr-i-0012-supplier-inventory`. Read its `design.md` §"Sprint planning — SWHR-S-0015" first. Requirements: **Initial stock load**.

## Design reference

No design blocks apply: this ticket has no screen. The screens are SWHR-T-0152's (`artifacts/SWHR-S-0015/design/`).

## Objective

Turn the existing once-per-fresh-database seed into the initial-load operation with a forced mode, and keep it off HTTP.

## Steps

1. Read P5 and R1/Q1. The seed data (task 5.1) already exists in `db/seed/inventory.ts` (SD-1).
2. Write the tests first in `lib/db/inventorySeed.test.ts` (extend the existing file), titled SWHR-C-0401, SWHR-C-0402 and SWHR-C-0403. Assert the return value (`"loaded"` / `"skipped"`) too, and that a forced load leaves a non-seeded item untouched.
3. Replace `seedInventory` with `loadInitialStock(db, { force })` per P5. The forced path upserts; the unforced path checks for any row first, so `db/client.ts` drops its own emptiness check and just calls it.
4. Task 5.3: add no route. Record in the function's comment that a forced load has no HTTP entry point and why (R1).

## File/module ownership

- `db/seed/inventory.ts`, `db/client.ts` (the stock-seed call only), `lib/db/inventorySeed.test.ts`

## Definition of Done

AC-1 to AC-4 of the ticket.
