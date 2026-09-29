## 1. Data model

- [x] 1.1 Add a Drizzle schema in `db/` for session-scoped cart lines (session id, item id, integer quantity, added-at) with a unique constraint on session id plus item id (SWHR-T-0096)
- [x] 1.2 Generate and commit the migration in `drizzle/` with `db-generate` (SWHR-T-0096)
- [x] 1.3 Define the CartLine and CartView types (lines, count, subtotal) shared by server and SPA (SWHR-T-0096)
- [x] 1.4 Choose and implement the money representation (integer minor units or decimal) per the OQ-2 decision (SWHR-T-0096)

## 2. Cart service

- [ ] 2.1 Implement get-or-create cart for the current session (SWHR-T-0097)
- [ ] 2.2 Implement add item with quantity 1, resetting an existing line to 1 (or per the OQ-1 decision) (SWHR-T-0097)
- [ ] 2.3 Implement remove item as a no-op when the item is absent (SWHR-T-0097)
- [ ] 2.4 Implement batch quantity update: remove when quantity is 0 or less, set or insert when positive (SWHR-T-0097)
- [ ] 2.5 Implement quantity parsing that maps any non-whole-number input to 0 (SWHR-T-0097)
- [ ] 2.6 Implement item count as the number of distinct stored lines (SWHR-T-0097)
- [ ] 2.7 Implement read-time catalog resolution of each line in the cart locale, skipping unresolvable items (SWHR-T-0097)
- [ ] 2.8 Implement subtotal over resolved lines with the decided rounding rule (SWHR-T-0097)
- [ ] 2.9 Implement empty cart and expose it to checkout for use after order placement (SWHR-T-0097)
- [ ] 2.10 Discard the session's cart on sign-out (SWHR-T-0097)
- [ ] 2.11 Return lines in insertion order (OQ-6) (SWHR-T-0097)

## 3. API routes

- [ ] 3.1 Add `routes/api/cart/index.get.ts` returning lines, count and subtotal (SWHR-T-0098)
- [ ] 3.2 Add `routes/api/cart/items.post.ts` to add an item by id (SWHR-T-0098)
- [ ] 3.3 Add `routes/api/cart/items/[itemId].delete.ts` to remove an item (SWHR-T-0098)
- [ ] 3.4 Add `routes/api/cart/index.patch.ts` to apply a batch of quantities (SWHR-T-0098)
- [ ] 3.5 Confirm cart routes require no sign-in (SWHR-T-0098)

## 4. Cart page

- [ ] 4.1 Add `src/pages/cart.tsx` with the empty-cart message state (SWHR-T-0099)
- [ ] 4.2 Render item rows with the linked attribute and name, Remove control, quantity input (max 10 characters) and currency unit price (SWHR-T-0099)
- [ ] 4.3 Add the Update Cart submission sending all quantities in one request (SWHR-T-0099)
- [ ] 4.4 Render the cart total and a Check Out control leading to order information entry (SWHR-T-0099)
- [ ] 4.5 Wire an Add to Cart control on item and catalog rows to the add route (SWHR-T-0099)

## 5. Tests

- [ ] 5.1 Route integration tests for add, including re-add of an existing item (SWHR-T-0100)
- [ ] 5.2 Route integration tests for remove, including removal of an absent item (SWHR-T-0100)
- [ ] 5.3 Route integration tests for batch update covering positive, zero, negative, non-numeric and absent-item quantities (SWHR-T-0100)
- [ ] 5.4 Unit tests for count and subtotal, including unresolvable items and the empty cart (SWHR-T-0100)
- [ ] 5.5 Test that catalog price changes are reflected at read time (SWHR-T-0100)
- [ ] 5.6 Test session isolation and discard on sign-out (SWHR-T-0100)
- [ ] 5.7 UI test for the cart page empty and populated states (SWHR-T-0100)
- [ ] 5.8 Playwright spec for add to cart, update quantities, remove, and check out (SWHR-T-0100)
