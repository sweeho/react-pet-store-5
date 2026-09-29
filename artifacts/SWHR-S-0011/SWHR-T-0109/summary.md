# SWHR-T-0109 — Order placement service and POST /api/orders

`POST /api/orders` validates both contacts, rejects an empty cart, and in one transaction issues the order id, enqueues the purchase-order XML on `opc.purchase-order`, empties the cart and records the session's `lastOrderId` / `lastOrderEmail`. It answers `{ orderId, email }`, or the mapped failure status and body from `failureResponse`. An unmapped failure (for example a rejected enqueue) answers 500 and rolls everything back.

Files: `lib/checkout/contact.ts` (+ test), `lib/checkout/placeOrder.ts`, `routes/api/orders/index.post.ts`, `routes/api/orders/index.test.ts`.

Decisions: the order e-mail is the billing e-mail, or the account e-mail when billing's is blank (SD-9). The cart is checked before the transaction and again inside it (SD-10). The total is the cart subtotal, which counts resolved lines only. A sign-on 401 passes through unchanged.

AC coverage: AC-1 to AC-11 map to SWHR-C-0258 to 0283, one or more tests each (route-level tests use a real `H3Event`, a signed-in session and a mocked `enqueue`).

Verification: `bun run lint`, `bun run typecheck` and `bun run verify` all exit 0. Red and green recorded via the platform.
