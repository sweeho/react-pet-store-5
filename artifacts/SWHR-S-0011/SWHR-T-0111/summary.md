# SWHR-T-0111 — Checkout screens

Built from the four mockups in `artifacts/SWHR-S-0011/design/` (read as files).

- `/checkout`: order information form, both sections pre-filled from `GET /api/account`, masked-card Payment panel, Submit posts to `/api/orders`. On 200 it dispatches `cart:changed` and goes to `/order-complete`; on failure it goes to the response's `screen`, else `/error`.
- `/order-complete` (reads `GET /api/orders/last`), `/order-error` and `/error` (shared `ErrorState`). Copy in en_US, ja_JP, zh_CN under `src/i18n/screens/`.
- `lib/db/readTransaction.ts` `withReadTransaction`: falls back to the plain connection if no transaction can begin, ignores a commit failure, rethrows errors from the read.
- `routes/api/orders/last.get.ts`: `{ orderId, email }` from the session, 404 when no order.
- `e2e/checkout.spec.ts`: cart to pre-filled form; submit, back, re-submit shows Order Error with the same last order id.

Deviations: the last-order route returns an empty `email` rather than 404 when the order exists without one (the E2E account has no e-mail); the order complete page then omits the e-mail sentence. `shell.spec.ts` and `language-switch.spec.ts` needed no change.

AC coverage: 0257/0265 in `e2e/checkout.spec.ts`; 0259 in `checkout.test.tsx`; 0273 in `order-complete.test.tsx`; 0261 and 0286 in `routes/api/orders/last.test.ts`.

Verification: `bun run verify:full` — exit 0; 816 unit and 64 E2E tests passed.
