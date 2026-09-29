# PLAN — SWHR-T-0147: Data model (task group 1)

Change: `swhr-i-0012-supplier-inventory`. Read its `design.md` §"Sprint planning — SWHR-S-0015" first. Requirements: **Supplier stock record**.

## Design reference

No design blocks apply: this ticket has no screen. The screens are SWHR-T-0152's (`artifacts/SWHR-S-0015/design/`).

## Objective

Give the rest of the change one way to read and create stock records. The table and its migration already exist (SD-1), so tasks 1.1 and 1.2 are verified, not rebuilt.

## Steps

1. Read P1 and SD-1. Confirm `supplierInventory` in `db/schema.ts` and `drizzle/0008_lazy_jimmy_woo.sql` match D1 (item id PK, integer quantity NOT NULL, no CHECK). Change neither.
2. Write the three scenario tests first in `lib/supplier/inventory.test.ts`, titled SWHR-C-0390, SWHR-C-0391 and SWHR-C-0392. Copy the setup of `lib/supplier/stock.test.ts` (in-memory db, table cleared in `beforeEach`).
3. Implement `lib/supplier/inventory.ts` per P1: `listStockRecords` (numeric-aware item-id order, e.g. `localeCompare(b, undefined, { numeric: true })`), `getStockRecord`, `createStockRecord`. Each takes the caller's executor, so it joins a transaction.
4. Add one test that `listStockRecords` orders EST-2 before EST-10.

## File/module ownership

- new `lib/supplier/inventory.ts`, `lib/supplier/inventory.test.ts`

Do not touch `db/schema.ts`, `drizzle/**`, `lib/supplier/stock.ts` or `db/seed/**`.

## Definition of Done

AC-1 to AC-4 of the ticket.
