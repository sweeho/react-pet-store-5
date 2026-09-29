# TDD result — SWHR-T-0134

## Test cases

- SWHR-C-0346 (lib/db/cascade.test.ts): deleting an order removes contact, address, card and three lines.
- SWHR-C-0376 (lib/db/cascade.test.ts): deleting a supplier order removes contact, address and lines.
- Upgrade test (lib/db/migrate.test.ts): a 0007 database upgrades through 0008 keeping every row, with an empty foreign_key_check.

## Red run

Run id ec3d4c25-6a5e-49a2-87f0-92a7f8b1b481 (valid). Both cases failed on assertions: `expected [ 'orderId', 'lineNum', … ] to include 'quantityShipped'` and `supplierContacts: expected 1 to be +0`. The upgrade test also failed (foreign key constraint failed on the supplier delete).

## Green run

Run id 40ff2985-3d97-42df-b5f7-60e56b86c48a (valid); both cases pass. `bun run verify:full`: exit 0, 902 unit tests passed, 69 E2E passed.

## Notes

Red ids above.
