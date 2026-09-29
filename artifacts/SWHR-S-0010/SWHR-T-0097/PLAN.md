# PLAN — SWHR-T-0097: Cart service

Change: `swhr-i-0008-shopping-cart` · Tasks group 2 · Requirements: Add item to cart, Remove item from cart, Batch quantity update, Non-numeric quantity treated as zero, Cart item count, Cart line contents, Catalog resolution at read time, Unresolvable cart items, Cart subtotal, Empty cart after order placement, One cart per shopper session

## Design reference

Mockups and wireframes are exported byte-exact under `artifacts/SWHR-S-0010/design/` (index: `MANIFEST.md`):
`mockup-shopping-cart-with-items.html`, `mockup-shopping-cart-after-update-cart.html`, `mockup-shopping-cart-empty.html`, and the three matching `wireframe-*.html` files. They are not needed for this ticket.

## Objective

Implement every cart rule in `lib/cart/lines.ts` behind the P4 surface, returning `CartView` (SWHR-T-0096).

## Steps

1. Read `openspec/changes/swhr-i-0008-shopping-cart/design.md` §Sprint planning: P1, P2, P4, P5, P6, P9, SD-1 and SD-3. **Check SD-1 first.** If the "Add item to cart" requirement has been corrected to increment, implement increment and follow the updated criterion. Otherwise implement reset to 1 (P1).
2. Rework `addCartItem` (P1, P6) and add `removeCartItem`, `parseQuantity`, `updateCartQuantities`, `countCartLines` and `emptyCart` (P4, P5, P9).
3. Replace `getCartWithDetails` with `getCart(event, sessionId): Promise<CartView>`. It resolves through `getCartItemDetails` (cart locale), builds `CartLine`s with `unitCost = listPrice` and integer `lineTotal`, orders lines by `addedAt` then `id`, sums `subtotal` over resolved lines, and sets `count` = stored lines (P2, P3).
4. Tasks 2.1 and 2.10 already hold through `lib/auth/session.ts`. Keep `deleteCartLinesForSession` exported and unchanged in behaviour, and cover "Shopper signs out" with a test.
5. Fix the pre-existing assertions this change breaks:
   - `lib/cart/lines.test.ts` "increments"
   - `routes/api/cart/items.test.ts` "increments the quantity…" (that assertion only)
   - `e2e/sign-on.spec.ts` SWHR-C-0135 (add three different items, not one item three times, and assert three lines)
   - the route handlers' imports of `getCartWithDetails` (keep `{ lines }` answering until SWHR-T-0098)
6. Write unit tests in `lib/cart/lines.test.ts` for every criterion. Use integer minor units (1850, 5550, 5350, 2000; SD-7). For "cannot be resolved", insert an `item` row with no `itemDetails` in the cart locale (P6).

## File/module ownership

- `lib/cart/lines.ts`
- `lib/cart/lines.test.ts`
- `routes/api/cart/index.get.ts`, `routes/api/cart/items.post.ts` (import rename only)
- `routes/api/cart/items.test.ts` (the increment assertion only)
- `e2e/sign-on.spec.ts` (SWHR-C-0135 cart setup and assertion only)

Fixed interface: the P4 signatures. SWHR-T-0098 calls them unchanged, and checkout later calls `emptyCart(sessionId, tx)`.

## Definition of Done

AC-1 … AC-17, each proven by a test in `lib/cart/lines.test.ts`. SWHR-C-0135 still passes against the new add rule.
