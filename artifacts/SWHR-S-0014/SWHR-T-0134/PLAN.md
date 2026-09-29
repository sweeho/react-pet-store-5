# PLAN — SWHR-T-0134: Data model (task group 1)

Change: `swhr-i-0011-order-fulfillment`. Read its `design.md` §"Sprint planning — SWHR-S-0014" first. Requirements: **Purchase order deletion removes its dependents**, **Supplier purchase order deletion removes its dependents**.

## Design reference

No design blocks: this capability has no screens (the change's design.md §User interface).

## Objective

Add the schema the later groups code against, in one generated migration, without changing any behaviour that already ships.

## Steps

1. Read design §Sprint planning, Codebase findings, P1, SD-1, SD-5 and SD-9.
2. Reproduce first. Add cascade tests for both scenarios (delete a header row, then query each noted child id). The supplier case fails today because its foreign keys do not cascade.
3. Edit `db/schema.ts` exactly per P1: `orderWorkflow`, `orderLines.quantityShipped`, `supplierInventory`, and cascades on the three supplier child tables. Leave `purchaseOrders.status` alone, because SWHR-T-0137 moves it.
4. Generate migration 0008 with the project's migration generator and commit it with its snapshot. Do not hand-edit it.
5. Add an upgrade test next to `lib/db/migrate.test.ts`'s cases. Start from a file database migrated through 0007 and holding one purchase order with lines and one supplier order with lines, upgrade it, and check every row is kept and `foreign_key_check` is empty (AC-4).

## File/module ownership

- `db/schema.ts`
- `drizzle/0008_*.sql`, `drizzle/meta/*`
- `lib/db/migrate.test.ts`
- new `db/schema.cascade.test.ts` or a `lib/db/` test file for the two deletion scenarios

Do not touch `lib/orders/**`, `lib/b2b/**` or `db/client.ts`.

## Definition of Done

AC-1 to AC-4 of the ticket.
