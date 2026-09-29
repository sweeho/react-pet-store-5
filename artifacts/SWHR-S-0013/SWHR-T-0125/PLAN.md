# PLAN — SWHR-T-0125: Checkout with blank e-mail leaves order stuck

Change: `swhr-s-0013-bugfix-swhr-t-0125-checkout` · Requirement: **Required billing and shipping contact fields** (`checkout`, SWHR-R-0147)

## Design reference

No design blocks. This bugfix sprint has no idea canvas design, and no screen changes.

## Objective

An order is never placed without a contact e-mail. When both the billing e-mail and the account e-mail are blank, submission places no order and reports `billing.email` as missing. It never confirms an order that intake cannot store. The root cause is in `proposal.md` §Why.

## Steps

1. Read `design.md` D1–D4.
2. Reproduce first. Add the route test for scenario "No contact e-mail anywhere" to `routes/api/orders/index.test.ts` (D4), using an account created with a blank e-mail. It fails today with a 200 and a queued message.
3. Add the fallback guard case (D4, D3): the billing e-mail is blank, the account has one, and the queued `emailId` is the account's e-mail.
4. In `lib/checkout/placeOrder.ts`, after `email` is resolved and before `db.transaction`, throw `MissingFormDataFailure(["billing.email"])` when it is blank (D1, D2).
5. In `e2e/checkout.spec.ts` SWHR-C-0265, fill the Billing Information e-mail input before the first Submit (D4). Leave `e2e/account-helpers.ts` alone.

## File/module ownership

- `lib/checkout/placeOrder.ts`
- `routes/api/orders/index.test.ts`
- `e2e/checkout.spec.ts`

Fixed interfaces, which must not change:

- `placeOrder(event, form, opts?)` keeps its signature and its `{ orderId, email }` result.
- `MissingFormDataFailure(missing: string[])` and the `ERROR_SCREENS` mapping in `lib/errors/routing.ts` stay as they are. The rejection answers 400 with `screen: "/error"` and `missing: ["billing.email"]`.
- The purchase-order reader and writer (`lib/b2b/documents/`) are not edited.

## Definition of Done

AC-1 to AC-4 of the ticket. AC-1 and AC-4 are proven by route cases in `routes/api/orders/index.test.ts`. AC-2 and AC-3 are proven by the existing cases SWHR-C-0262 and SWHR-C-0265, which still pass.
