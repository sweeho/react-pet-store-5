# PLAN — SWHR-T-0111: Checkout screens and cart-to-confirmation E2E

Change: `swhr-i-0009-checkout-and-order-placement` · Tasks group 5 · Requirements: **Order information screen**, **Order complete screen**, **Empty-cart order rejection** (re-submit), **Checkout hands the order off asynchronously** (form), **Consistent reads while rendering a screen**

## Design reference

Mockups and wireframes are exported byte-exact under `artifacts/SWHR-S-0011/design/` (index: `MANIFEST.md`):
`mockup-checkout-order-information.html`, `mockup-order-confirmation.html`, `mockup-empty-cart-order-error.html`, `mockup-general-error-page-checkout-submitted-wi.html`, and the four matching `wireframe-*.html` files. **Build what the mockups show**, inside the existing site shell, using the shared `ErrorState` and `EmptyState` frames for the two error screens.

## Objective

Replace the checkout placeholder with the order information form, and add the order complete, empty-cart Order Error and general error screens, wired to `POST /api/orders` and `GET /api/orders/last`.

## Steps

1. Read `openspec/changes/swhr-i-0009-checkout-and-order-placement/design.md`: §Sprint planning P5, P6, P8, SD-1, SD-5 and SD-9. Then open the four mockups.
2. Add `lib/db/readTransaction.ts` `withReadTransaction` (P8), and `routes/api/orders/last.get.ts`:
   - `requireSignOn`
   - returns the session's `lastOrderId` and `lastOrderEmail` as `{ orderId, email }`, or 404
   - reads through `withReadTransaction`
3. Rebuild `src/pages/checkout.tsx` (P8):
   - The two sections are pre-filled from `GET /api/account`: first name, last name, street, line 2, city, state (select, `STATES`), postal code, country (select, `COUNTRIES`), telephone and e-mail. Required markers follow the mockup.
   - A Payment panel shows the masked card and expiry, and links to `/account-edit`.
   - Submit is disabled while pending and posts an `OrderForm`.
   - On 200, dispatch `cart:changed` and navigate to `/order-complete`. Otherwise navigate to the response's `screen`, or to `/error` if it has none.
4. Add `src/pages/order-complete.tsx` (heading, order number, e-mail statement, thank-you, Continue shopping), `src/pages/order-error.tsx` (spec copy, Continue shopping, View cart) and `src/pages/error.tsx` ("Something went wrong", Try again, Go to home page).
5. Add the copy in `src/i18n/screens/checkout.ts` (replace the placeholder strings), `order-complete.ts`, `order-error.ts` and `error.ts` for en_US, ja_JP and zh_CN. The en_US text is as in the spec and mockups.
6. Tests:
   - UI tests next to each page: [SWHR-C-0259] Jane Doe in both sections with Submit; [SWHR-C-0273] order 10017 and jane@example.com; the empty-cart Order Error copy; the general error page.
   - [SWHR-C-0261] Route test that `/checkout` is gated to `/signin` for an anonymous session, through the existing gate route or middleware.
   - [SWHR-C-0286] In `routes/api/orders/last.test.ts`, stub the transaction start to throw; the response is still 200 with the order.
   - E2E `e2e/checkout.spec.ts`: [SWHR-C-0257] a signed-in shopper with two items goes from cart to Check Out to the pre-filled form; [SWHR-C-0265] Submit shows the order complete page, Back and Submit again shows the empty-cart Order Error, and the last order id is unchanged.
7. Update only the existing assertions this change breaks: the placeholder assertions in `src/pages/checkout.test.tsx`, and any `/checkout` assertion in `e2e/shell.spec.ts` or `e2e/language-switch.spec.ts`.

## File/module ownership

- `src/pages/checkout.tsx`, `src/pages/checkout.test.tsx`
- `src/pages/order-complete.tsx`, `src/pages/order-error.tsx`, `src/pages/error.tsx` and their `*.test.tsx` (new)
- `src/i18n/screens/checkout.ts`, `order-complete.ts`, `order-error.ts`, `error.ts` (new except checkout), plus their registration in the screens index if one exists
- `lib/db/readTransaction.ts` and its test (new)
- `routes/api/orders/last.get.ts`, `routes/api/orders/last.test.ts` (new)
- `e2e/checkout.spec.ts` (new); `e2e/shell.spec.ts` and `e2e/language-switch.spec.ts` (broken `/checkout` assertions only)

Consumes unchanged: `POST /api/orders` and `FailureBody`, `GET /api/account`, and the `cart:changed` event. Fixed interfaces: `withReadTransaction<T>(fn: (tx: Executor) => T): T`, the `GET /api/orders/last` body `{ orderId: string; email: string }`, and the screen paths `/order-complete`, `/order-error` and `/error`.

## Definition of Done

AC-1 … AC-6 by the tests above, each titled with its case key. The E2E spec has been executed and passes.
