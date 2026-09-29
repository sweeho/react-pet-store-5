# SWHR-T-0107 summary

Checkout data model per design P3.

- `db/schema.ts`: `counters`, `purchaseOrders` (status default PENDING, CHECK), `orderContacts`, `orderAddresses`, `orderCards`, `orderLines`; `sessions.lastOrderId` / `lastOrderEmail`.
- `drizzle/0007_tiresome_namor.sql` + `meta/0007_snapshot.json` + journal: generated with `bun run db:generate`.
- `lib/messaging/outbox.ts`: channel `opc.purchase-order`, subscriber `order-intake`.
- `lib/orders/store.ts`: `persistPurchaseOrder` (shipping contact/address copied, total via `decimalToMinor` from the supplied total, no-op on existing orderId) and `getStoredOrder`.
- `lib/orders/store.test.ts`: cases SWHR-C-0280..0282 plus the idempotency test.

Verification: platform red then green recorded (see tdd-test-result.md); `bun run verify` exit 0, 777 tests passed. Not checked: applying migration 0007 to a database at 0006 by hand; the suite runs it on a fresh in-memory database.
