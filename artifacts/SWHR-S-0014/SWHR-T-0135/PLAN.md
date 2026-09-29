# PLAN — SWHR-T-0135: Purchase order persistence (task group 2)

Change: `swhr-i-0011-order-fulfillment`. Read its `design.md` §"Sprint planning — SWHR-S-0014" first. Requirements: **Purchase order record**, **Purchase order creation is atomic**, **Single stored contact serves as billing and shipping contact**, **Purchase order snapshot**, **Line item attributes and immutability**, **Line item creation requires an initial shipped quantity**.

## Design reference

No design blocks: this capability has no screens (the change's design.md §User interface).

## Objective

Give the order store a strict create, a snapshot that reports the single contact as both billing and shipping, and line access that can only change the shipped quantity. Intake stays idempotent.

## Steps

1. Read design P2, SD-2 (card already masked) and SD-3.
2. Write the scenario tests first in `lib/orders/store.test.ts` and a new `lib/orders/lines.test.ts`, titled with their case keys.
   - The rollback case (SWHR-C-0344) makes the card insert throw inside a `db.transaction` and checks that no header, contact or line row exists.
   - The immutability case (SWHR-C-0349) checks that the `lines.ts` exports have no setter for any field but `quantityShipped`, and that the stored quantity stays 3.
3. Add `DuplicateOrderError` in a new `lib/orders/errors.ts`.
4. Split `persistPurchaseOrder` into `createPurchaseOrder` (throws on a known id) and the existing idempotent wrapper (P2). Existing callers keep working unchanged.
5. Extend `StoredOrder` and `getStoredOrder` with `billingContact`, `shippingContact` and `lines[].quantityShipped` (P2). Keep `contact` and `address` so order-approval code is untouched.
6. Add `lib/orders/lines.ts` with `setShippedQuantity` and `copyLine` (P2).
7. Add an assertion that the stored card number is masked (task 2.6, SD-2).

## File/module ownership

- `lib/orders/store.ts`, `lib/orders/store.test.ts`
- new `lib/orders/lines.ts`, `lib/orders/lines.test.ts`
- new `lib/orders/errors.ts`

Do not touch `lib/orders/approval.ts`, `intake.ts`, `adminData.ts` or `db/schema.ts`.

## Definition of Done

AC-1 to AC-10 of the ticket. AC-1 to AC-9 each have a test titled with their case key, and AC-10's signatures are exported as written.
