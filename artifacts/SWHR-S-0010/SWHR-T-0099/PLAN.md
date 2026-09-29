# PLAN — SWHR-T-0099: Cart page and header count

Change: `swhr-i-0008-shopping-cart` · Tasks group 4 · Requirements: **Cart screen**, Cart item count (header)

## Design reference

Mockups and wireframes are exported byte-exact under `artifacts/SWHR-S-0010/design/` (index: `MANIFEST.md`):
`mockup-shopping-cart-with-items.html`, `mockup-shopping-cart-after-update-cart.html`, `mockup-shopping-cart-empty.html`, and the three matching `wireframe-*.html` files. **Build what the mockups show.**

## Objective

Replace the list-only cart page with the spec's cart screen, and show the distinct-item count on the header Cart link.

## Steps

1. Read `openspec/changes/swhr-i-0008-shopping-cart/design.md` §Sprint planning: P3, P7, P8, SD-2 and SD-4. Then open the three mockups.
2. Rebuild `src/pages/cart.tsx` per P8:
   - Load `GET /api/cart`. `count === 0` shows only "Your Shopping Cart is Empty." and a "Back to home" link.
   - Otherwise show the rows with the linked attribute + product name, a Remove button (DELETE), and a quantity `<input maxLength={10}>` pre-filled with the line quantity.
   - Update Cart sends every row's raw input value in one PATCH.
   - Show the subtotal via `formatPrice(subtotal, view.locale)`, and a Check Out link to `/checkout`.
   - After Remove or Update, re-render from the returned `CartView`.
3. Localize all copy in `src/i18n/screens/cart.ts` (en_US text exactly as the spec and mockups; ja_JP and zh_CN translations).
4. Add `src/hooks/useCartCount.ts`. Show the count on the Cart link in `src/components/layout/SiteHeader.tsx`, with an accessible name that includes the count. Refresh on the `cart:changed` window event, which `AddToCartButton` and the cart page dispatch after a successful change (task 4.5's wiring already exists; only add the dispatch).
5. Rewrite `src/pages/cart.test.tsx` for the empty and populated states, Remove and Update Cart (mocked fetch, as today). Update the e2e assertions that read the old "Quantity: n" / "数量: n" text to read the quantity field value: `e2e/catalog-browsing.spec.ts` (the cart assertions) and `e2e/sign-on.spec.ts` SWHR-C-0135/SWHR-C-0130 (the cart assertions).

## File/module ownership

- `src/pages/cart.tsx`, `src/pages/cart.test.tsx`
- `src/i18n/screens/cart.ts`
- `src/hooks/useCartCount.ts` (new) and its test (new)
- `src/components/layout/SiteHeader.tsx` and its existing test file
- `src/components/catalog/AddToCartButton.tsx` (the event dispatch only) and its test
- `e2e/catalog-browsing.spec.ts`, `e2e/sign-on.spec.ts` (cart-page assertions only)

Fixed interface: consumes the P7 routes and the `CartView` unchanged. The event name is `cart:changed`.

## Definition of Done

AC-1 … AC-5: AC-1 and AC-2 by UI tests in `src/pages/cart.test.tsx`, AC-3 … AC-5 by UI tests of the request sent and the resulting render. The header shows 3 / 2 / 0 for the three mockup states.
