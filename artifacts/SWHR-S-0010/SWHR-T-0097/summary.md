# SWHR-T-0097 summary

Cart rules now live in `lib/cart/lines.ts` behind the P4 surface: `addCartItem` (reset to 1, returns false for an unknown item), `removeCartItem`, `parseQuantity`, `updateCartQuantities`, `countCartLines`, `emptyCart(sessionId, tx?)` and `getCart` (read-time lines at list price, integer line totals, subtotal over resolved lines, count of stored lines, ordered by `addedAt` then `id`). `getCartWithDetails` is removed.

Files: `lib/cart/lines.ts`, `lib/cart/lines.test.ts`, `routes/api/cart/index.get.ts` and `items.post.ts` (call `getCart`, still answer `{ lines }`), `routes/api/cart/items.test.ts` (re-add assertion now expects 1), `e2e/sign-on.spec.ts` SWHR-C-0135 (three different items, three `数量: 1` lines).

Decisions:

- SD-1: the requirement still says reset to 1, so reset was implemented (P1).
- Cases SWHR-C-0248/0249 are covered at service level (`updateCartQuantities`); the PATCH route arrives in SWHR-T-0098. SWHR-C-0256 is covered through `emptyCart`, since no order placement exists yet.
- Unresolvable items are tested with an `item` row that has no `itemDetails` (P6).

Verification: `bun run lint`, `bun run typecheck`, `bun run test` (150 files, 747 tests) all pass; E2E result is in the work log.
