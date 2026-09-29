# SWHR-T-0134 summary

Adds migration 0008 (generated, not hand-edited): `orderWorkflow` table (status CHECK, no FK), `orderLines.quantityShipped` (default 0), `supplierInventory` (itemId, quantity), and ON DELETE CASCADE on `supplierContacts`, `supplierAddresses`, `supplierLineItems`. `purchaseOrders.status` is untouched.

Files: `db/schema.ts`, `drizzle/0008_lazy_jimmy_woo.sql`, `drizzle/meta/{_journal.json,0008_snapshot.json}`, `lib/db/cascade.test.ts` (new), `lib/db/migrate.test.ts` (0007 to 0008 upgrade case).

AC coverage: order deletion (SWHR-C-0346) and supplier order deletion (SWHR-C-0376) in `cascade.test.ts`; fixed contract by the generated SQL; upgrade with rows kept and `foreign_key_check` empty in `migrate.test.ts`.

Verification: `bun run verify:full` exit 0 (902 unit, 69 E2E passed).
