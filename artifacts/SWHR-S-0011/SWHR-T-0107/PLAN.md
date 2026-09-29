# PLAN — SWHR-T-0107: Checkout data model

Change: `swhr-i-0009-checkout-and-order-placement` · Tasks group 1 · Requirements: **Identifier counter record**, **Stored purchase order total**, **Stored purchase order contact and payment**

## Design reference

No UI in this ticket. The sprint's mockups are under `artifacts/SWHR-S-0011/design/` (index: `MANIFEST.md`); they are not needed here.

## Objective

Add the counter and purchase-order tables, the session's last-order columns and the `opc.purchase-order` channel, plus `persistPurchaseOrder`, which stores an incoming order as a snapshot with its total taken verbatim.

## Steps

1. Read `openspec/changes/swhr-i-0009-checkout-and-order-placement/design.md`: §Sprint planning P1 (OQ-5), P3, SD-3, SD-6 and SD-7.
2. Extend `db/schema.ts` with `counters`, `purchaseOrders`, `orderContacts`, `orderAddresses`, `orderCards` and `orderLines`, and add `sessions.lastOrderId` and `sessions.lastOrderEmail`, exactly as P3 states. Generate migration 0007 with the project's drizzle generate script and commit it with its snapshot.
3. In `lib/messaging/outbox.ts`, add `"opc.purchase-order"` to `Channel` with `SUBSCRIBERS` `["order-intake"]`. Change nothing else there.
4. Add `lib/orders/store.ts`:
   - `persistPurchaseOrder(tx, po)` stores `po.shippingInfo` as a new contact and address, never a reference to the profile contact. It stores `totalValue = decimalToMinor(po.totalPrice, po.locale)` with no recomputation, the card as given, and lines with their unit prices converted.
   - It does nothing when `orderId` already exists.
   - `getStoredOrder(orderId, tx?)` returns the order with its contact, address, card and lines, or null.
5. Tests in `lib/orders/store.test.ts`:
   - [SWHR-C-0280] A duplicate counter insert is rejected.
   - [SWHR-C-0281] The total is 51.50 (stored 5150) while the lines sum to 40.00.
   - [SWHR-C-0282] Stored order: after the profile address changes through the account services, the stored city stays "Palo Alto".
   - A second persist of the same order id is a no-op.
6. Update any existing test that enumerates `Channel` values or schema tables, if one breaks.

## File/module ownership

- `db/schema.ts` (new tables, session columns), `drizzle/0007_*.sql`, `drizzle/meta/*` (generated)
- `lib/messaging/outbox.ts` (the channel and subscriber entry only)
- `lib/orders/store.ts`, `lib/orders/store.test.ts` (new)

Fixed interfaces: P3's table and column names, `Channel` `"opc.purchase-order"` with consumer `"order-intake"`, and `persistPurchaseOrder(tx: Executor, po: PurchaseOrder): void` and `getStoredOrder(orderId: string, tx?: Executor): StoredOrder | null`.

## Definition of Done

AC-1 … AC-3 by `lib/orders/store.test.ts`, each test titled with its case key. The migration applies on a fresh database and on one migrated to 0006.
