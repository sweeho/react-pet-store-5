# Proposal: shopping-cart

## Why

The Java Pet Store 1.3.2 storefront keeps one in-memory cart per shopper session. Shoppers add catalog items to it, remove them, change quantities in one submission, and check out from it. The rebuild must reproduce this behaviour, including several rules no document states:

- re-adding an item resets its quantity to 1 instead of incrementing it
- a quantity of 0 or less removes the line
- a non-numeric quantity is treated as 0
- the item count is distinct lines, not units
- prices are re-read from the catalog on every read
- items the catalog cannot resolve are silently dropped from the listing and the subtotal

This change captures those rules from the extracted IR.

## What Changes

- Add the `shopping-cart` capability, with requirements for:
  - the cart screen (1 screen requirement)
  - add, remove and batch quantity update, including the edge cases above
  - item count and subtotal arithmetic
  - read-time price and description resolution from the catalog
  - cart line contents
  - per-session cart scope, lazy creation and discard on sign-out
  - emptying the cart after an order is placed
- Flag seven disputed or low-confidence points for a human decision (see `design.md`, OQ-1 to OQ-7). The most significant are the reset-to-1 behaviour on re-add, floating-point money with no rounding rule, and the count/listing disagreement for unresolvable items.

## Impact

- New spec: `specs/shopping-cart/spec.md`.
- New data: a session-scoped cart store. See `design.md` for the storage decision. If it is persisted, it is a Drizzle schema under `db/` with a migration generated into `drizzle/`.
- New server routes under `routes/api/cart/`, and one SPA page, `src/pages/cart.tsx`.
- Depends on:
  - `catalog-browsing`, for item lookup by id and locale (name, attribute, list price)
  - `localization`, for the cart locale
  - `checkout`, which reads the cart and empties it after placing an order
  - `customer-account` / sign-on, because sign-out discards the cart
