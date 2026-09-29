# PLAN — SWHR-T-0096: Cart data model

Change: `swhr-i-0008-shopping-cart` · Tasks group 1 · Requirement: **One cart per shopper session**

## Design reference

Mockups and wireframes are exported byte-exact under `artifacts/SWHR-S-0010/design/` (index: `MANIFEST.md`):
`mockup-shopping-cart-with-items.html`, `mockup-shopping-cart-after-update-cart.html`, `mockup-shopping-cart-empty.html`, and the three matching `wireframe-*.html` files. They are not needed for this ticket.

## Objective

Publish the shared cart contract every later TASK codes against, and confirm the existing `cartLines` table and minor-unit money already satisfy tasks 1.1, 1.2 and 1.4.

## Steps

1. Read `openspec/changes/swhr-i-0008-shopping-cart/design.md` §Sprint planning: Codebase findings, then P2, P3 and SD-6.
2. Add `lib/cart/types.ts` with `CartLine` and `CartView` exactly as P3 states. Document that every money field is integer minor units in `CartView.locale`, and that `unitCost` is the list price (P2).
3. Confirm `db/schema.ts` `cartLines` meets 1.1 (session id, item id, integer quantity, added-at, unique session+item). Confirm `drizzle/0004_lonely_pete_wisdom.sql` creates it, so 1.2 needs no new migration. Update the `cartLines` comment to point at this change instead of "remain that change's". No column change.
4. Add `lib/cart/types.test.ts`, or extend `lib/cart/lines.test.ts` only if the helper already lives there, covering the two criteria: a fresh session lists no lines, and session B does not see session A's EST-6.

## File/module ownership

- `lib/cart/types.ts` (new)
- `lib/cart/types.test.ts` (new)
- `db/schema.ts` (the `cartLines` comment only)

Fixed interface: `CartLine` and `CartView` as in P3. SWHR-T-0097, SWHR-T-0098 and SWHR-T-0099 import them unchanged.

## Definition of Done

AC-1 and AC-2. No migration is added under `drizzle/`.
