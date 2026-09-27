## 1. Data model

- [ ] 1.1 Add a Drizzle schema in `db/` for session-scoped cart lines (session id, item id, integer quantity, added-at) with a unique constraint on session id plus item id
- [ ] 1.2 Generate and commit the migration in `drizzle/` with `db-generate`
- [ ] 1.3 Define the CartLine and CartView types (lines, count, subtotal) shared by server and SPA
- [ ] 1.4 Choose and implement the money representation (integer minor units or decimal) per the OQ-2 decision

## 2. Cart service

- [ ] 2.1 Implement get-or-create cart for the current session
- [ ] 2.2 Implement add item with quantity 1, resetting an existing line to 1 (or per the OQ-1 decision)
- [ ] 2.3 Implement remove item as a no-op when the item is absent
- [ ] 2.4 Implement batch quantity update: remove when quantity is 0 or less, set or insert when positive
- [ ] 2.5 Implement quantity parsing that maps any non-whole-number input to 0
- [ ] 2.6 Implement item count as the number of distinct stored lines
- [ ] 2.7 Implement read-time catalog resolution of each line in the cart locale, skipping unresolvable items
- [ ] 2.8 Implement subtotal over resolved lines with the decided rounding rule
- [ ] 2.9 Implement empty cart and expose it to checkout for use after order placement
- [ ] 2.10 Discard the session's cart on sign-out
- [ ] 2.11 Return lines in insertion order (OQ-6)

## 3. API routes

- [ ] 3.1 Add `routes/api/cart/index.get.ts` returning lines, count and subtotal
- [ ] 3.2 Add `routes/api/cart/items.post.ts` to add an item by id
- [ ] 3.3 Add `routes/api/cart/items/[itemId].delete.ts` to remove an item
- [ ] 3.4 Add `routes/api/cart/index.patch.ts` to apply a batch of quantities
- [ ] 3.5 Confirm cart routes require no sign-in

## 4. Cart page

- [ ] 4.1 Add `src/pages/cart.tsx` with the empty-cart message state
- [ ] 4.2 Render item rows with the linked attribute and name, Remove control, quantity input (max 10 characters) and currency unit price
- [ ] 4.3 Add the Update Cart submission sending all quantities in one request
- [ ] 4.4 Render the cart total and a Check Out control leading to order information entry
- [ ] 4.5 Wire an Add to Cart control on item and catalog rows to the add route

## 5. Tests

- [ ] 5.1 Route integration tests for add, including re-add of an existing item
- [ ] 5.2 Route integration tests for remove, including removal of an absent item
- [ ] 5.3 Route integration tests for batch update covering positive, zero, negative, non-numeric and absent-item quantities
- [ ] 5.4 Unit tests for count and subtotal, including unresolvable items and the empty cart
- [ ] 5.5 Test that catalog price changes are reflected at read time
- [ ] 5.6 Test session isolation and discard on sign-out
- [ ] 5.7 UI test for the cart page empty and populated states
- [ ] 5.8 Playwright spec for add to cart, update quantities, remove, and check out
