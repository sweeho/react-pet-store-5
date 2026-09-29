# PLAN — SWHR-T-0109: Order placement service and POST /api/orders

Change: `swhr-i-0009-checkout-and-order-placement` · Tasks group 3 · Requirements: **Checkout hands the order off asynchronously**, **Required billing and shipping contact fields**, **Empty-cart order rejection**, **Purchase order contents**, **Order lines and total**, **Credit card attached to every order**, **Order hand-off to order processing**, **Order placement is one transaction**

## Design reference

No UI in this ticket. The sprint's mockups are under `artifacts/SWHR-S-0011/design/` (index: `MANIFEST.md`); they are not needed here.

## Objective

Turn a signed-in session's cart and the submitted form into one purchase order, handed to order processing through the outbox. Id issuance, enqueue, cart emptying and the session's last order all go in one transaction.

## Steps

1. Read `openspec/changes/swhr-i-0009-checkout-and-order-placement/design.md`: §Legacy flow steps 3–5, then §Sprint planning P1, P2, P4, P5, P6 and SD-1, SD-2, SD-7, SD-8, SD-9 and SD-10.
2. Add `lib/checkout/contact.ts` `validateOrderContacts` (P6). Missing fields are named `"<billing|shipping>.<field>"`.
3. Add `lib/checkout/placeOrder.ts` `placeOrder` (P6):
   - Get the user from `requireSignOn`, and the account card and e-mail from `getCustomerAccount`.
   - Get lines and locale from `getCart`.
   - The transaction is `nextId(ORDER_ID_PREFIX, tx)`, then `enqueue(tx, "opc.purchase-order", writePurchaseOrder(po))`, then `emptyCart(sessionId, tx)`, then the session's `lastOrderId` and `lastOrderEmail`.
4. Add `routes/api/orders/index.post.ts`: it answers 200 `{ orderId, email }`, and `failureResponse(error)` (status and body) for anything thrown.
5. Integration tests in `routes/api/orders/index.test.ts` use a real `H3Event`, a signed-in session, a seeded account and cart, and a queue captured from `outboxMessages`:
   - [SWHR-C-0258] 200, one message, no stored order with status APPROVED.
   - [SWHR-C-0260] San Jose shipping, Palo Alto billing, read from the queued document.
   - [SWHR-C-0262] 400, `missing` includes `shipping.telephone`, no message.
   - [SWHR-C-0264] 409, screen `/order-error`, no message.
   - [SWHR-C-0266] Fake clock; the document carries order id, `j2ee`, `bill@example.com`, the date, both contacts, the card and en_US.
   - [SWHR-C-0267] Lines 0 and 1 and the total "51.50".
   - [SWHR-C-0268] The card has a number, type and expiry.
   - [SWHR-C-0269] One message and the cart is empty.
   - [SWHR-C-0270] `enqueue` stubbed to throw: an error status, no `orderId`, and the cart still has 2 lines.
   - [SWHR-C-0283] Counter at 5, `enqueue` stubbed to throw: the counter is still 5, and there are no outbox rows and no `orderId`.
   - Also, route-level: an empty cart answers screen `/order-error` (SWHR-C-0284 through the real route).
6. [SWHR-C-0263] Unit test in `lib/checkout/contact.test.ts`: a blank shipping line 2 and e-mail pass.

## File/module ownership

- `lib/checkout/contact.ts`, `lib/checkout/contact.test.ts`, `lib/checkout/placeOrder.ts` (new)
- `routes/api/orders/index.post.ts`, `routes/api/orders/index.test.ts` (new)

Consumes unchanged: `nextId`, `failureResponse` and the failure classes, `orderCardFromAccount`, `minorToDecimal`, `enqueue`, `emptyCart`, `getCart`, `writePurchaseOrder`. Fixed interface: `OrderForm`, `validateOrderContacts`, `placeOrder`, and the route's 200 body `{ orderId: string; email: string }`.

## Definition of Done

AC-1 … AC-11 by the tests above, each titled with its case key. The UI side of AC-5 (Order Error copy) is SWHR-T-0111's.
