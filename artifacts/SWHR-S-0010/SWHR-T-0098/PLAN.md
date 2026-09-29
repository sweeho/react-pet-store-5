# PLAN — SWHR-T-0098: Cart API routes

Change: `swhr-i-0008-shopping-cart` · Tasks group 3 · Requirements: Anonymous cart use (plus the HTTP surface for every service requirement)

## Design reference

Mockups and wireframes are exported byte-exact under `artifacts/SWHR-S-0010/design/` (index: `MANIFEST.md`):
`mockup-shopping-cart-with-items.html`, `mockup-shopping-cart-after-update-cart.html`, `mockup-shopping-cart-empty.html`, and the three matching `wireframe-*.html` files. They are not needed for this ticket.

## Objective

Expose the cart service over four ungated Nitro routes that all answer a `CartView`.

## Steps

1. Read `openspec/changes/swhr-i-0008-shopping-cart/design.md` §Sprint planning: P3, P6 and P7.
2. `routes/api/cart/index.get.ts`: return `getCart(event, session.id)`.
3. `routes/api/cart/items.post.ts`: 400 without `itemId`; 404 when `addCartItem` returns `false`; otherwise return the `CartView`.
4. New `routes/api/cart/items/[itemId].delete.ts` and `routes/api/cart/index.patch.ts` (400 when `quantities` is not a plain object). Both return the `CartView`.
5. Get the session with `getAuthSession(event, "storefront")`, as the existing routes do. Never call the sign-on gate (task 3.5).
6. Update `routes/api/cart/index.test.ts` and `items.test.ts` to the `CartView` shape. Add `items/[itemId].test.ts` and `index.patch.test.ts` with one happy path and one error path each, mirroring `items.test.ts` (real `H3Event`, cookie carried between requests).
7. Keep the SPA rendering: change `src/pages/cart.tsx` field reads to the flat `CartLine` fields and `formatPrice(line.unitCost, view.locale)`. Change nothing else there; SWHR-T-0099 rebuilds the page.

## File/module ownership

- `routes/api/cart/index.get.ts`, `routes/api/cart/items.post.ts`
- `routes/api/cart/items/[itemId].delete.ts` (new), `routes/api/cart/index.patch.ts` (new)
- `routes/api/cart/index.test.ts`, `routes/api/cart/items.test.ts`
- `routes/api/cart/items/[itemId].test.ts` (new), `routes/api/cart/index.patch.test.ts` (new)
- `src/pages/cart.tsx` (data field reads only)

Fixed interface: the P7 routes, request bodies and status codes; every response is a `CartView`.

## Definition of Done

AC-1, proven by an anonymous POST test that asserts no sign-on redirect or 401. The existing cart e2e specs still pass.
