# SWHR-T-0099 summary

`/cart` is rebuilt from the mockups (`mockup-shopping-cart-with-items.html`, `-empty.html`): a table of rows (linked attribute + product name, "ITEM · Category" line, Remove, quantity `<input maxLength=10>`, unit price), Update Cart with hint, Subtotal and a Check Out link to `/checkout`. Empty cart (`count === 0`) shows only "Your Shopping Cart is Empty." and a Back to home link. Remove (DELETE) and Update Cart (one PATCH with every raw input value) re-render from the returned `CartView`. The header Cart link shows the count (accessible name "Cart (n)") through the new `useCartCount` hook, which refetches on the `cart:changed` window event; `AddToCartButton` and the cart page dispatch it.

Files: `src/pages/cart.tsx`, `src/i18n/screens/cart.ts` (en_US, ja_JP, zh_CN), `src/hooks/useCartCount.ts` (+ export in `hooks/index.ts`), `src/components/layout/SiteHeader.tsx`, `src/components/catalog/AddToCartButton.tsx`, tests for each, and cart assertions in `e2e/catalog-browsing.spec.ts` and `e2e/sign-on.spec.ts`.

AC coverage: AC-1/AC-2 by SWHR-C-0232/0233; AC-3/AC-4 by the Remove and Update Cart tests in `src/pages/cart.test.tsx` (request sent and resulting render); AC-5 by the Check Out link test (href `/checkout`).

Decisions: the h1 stays "Cart" (other e2e specs assert it). The category line is derived from `categoryId` (title-cased) because `CartLine` carries no category name. The Remove button's accessible name is "Remove <item>" via `aria-label`. A failed Remove/Update leaves the screen unchanged.

Verification: `bun run lint`, `bun run typecheck`, `bun run test` (759 pass). `bun run test:e2e` (59 pass).
