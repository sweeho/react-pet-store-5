# Design: checkout (extracted from Java Pet Store 1.3.2)

## Context

Checkout turns a signed-in customer's cart into a purchase order and hands it to the Order Processing Centre (OPC) asynchronously. The customer gets an order id and a promise of a confirmation e-mail, and approval happens later in OPC. OPC is out of scope for this capability and belongs to `b2b-document-exchange` and the order-processing capabilities.

Source: the reconciled IR, 22 records including 2 screens, read from the pass files under `legacy-analysis/ir/_passes/`. Those records come from `apps/petstore`, `components/uidgen`, `components/asyncsender`, `components/purchaseorder`, `components/contactinfo`, `waf` and `docs`. Where a point below goes beyond the IR, it was checked directly against `legacy-source/` and carries its trace.

## Legacy flow (implementation notes, not requirements)

1. Cart → Check Out → `enter_order_information.screen`, which renders `docroot/enter_order_information.jsp`. `WEB-INF/signon-config.xml:69` protects that screen, so an anonymous visitor is redirected to sign on.
2. The form posts to `order.do`. `mappings.xml:78-80` maps that to `OrderHTMLAction`, and on success to `order_complete.screen` (`order_completed.jsp`).
3. `OrderHTMLAction.perform` builds an `OrderEvent(billTo = *_a fields, shipTo = *_b fields, creditCard)`. It runs in the web tier (`OrderHTMLAction.java:76-84`).
4. The WAF `RequestProcessor` forwards the event to the per-session stateful `EJBController`. Its `processEvent` is `Required`, so the whole of `OrderEJBAction.perform` runs in one container transaction (`waf/src/ejb-jar.xml:63-73`).
5. `OrderEJBAction.perform` (`OrderEJBAction.java:90-169`) does the following in order:
   - obtains the uid generator and calls `getUniqueId("1001")`
   - reads the user id and locale
   - checks the cart is non-empty. This happens after the id is issued, which is harmless because the exception rolls the transaction back.
   - builds `LineItem`s and the float total
   - calls `AsyncSender.sendAMessage(purchaseOrder.toXML())`
   - calls `cart.empty()`
   - returns `OrderEventResponse(billTo.email, orderId)`
6. `AsyncSenderEJB` sends a JMS `TextMessage` on a transacted session to `jms/AsyncSenderQueue`. `sun-j2ee-ri.xml:496-499` binds that queue to `jms/opc/OrderQueue`.
7. Exceptions go through `MainServlet` to `ScreenFlowManager.getExceptionScreen`, which picks the first `<exception-mapping>` assignable from the thrown class (`mappings.xml:110-112`).

Form field names are `given_name`, `family_name`, `address_1`, `address_2`, `city`, `state_or_province`, `postal_code`, `country`, `telephone_number` and `email`, suffixed `_a` for billing and `_b` for shipping. The markup also applies `maxlength` values, for example 30 for names and 70 for e-mail. Nothing server-side enforces those limits, so they are not requirements.

Identifier counters use `CounterEJBTable`: `name VARCHAR(255)` is the primary key and `counter INTEGER NOT NULL`. The DDL is in `sun-j2ee-ri.xml:629`.

## Mapping to the rebuild stack

- **Data model.** Add a `db/` schema file, for example `db/schema/counters.ts`, with a `counters` table: `name text primary key`, `value integer not null`. `bun run db:generate` produces the matching migration in `drizzle/`. Purchase order persistence (order, contact snapshot, address, card, lines) is owned by the order-processing capability, but the snapshot rule in the spec applies wherever it lands.
- **Identifier issuance.** Use one Drizzle transaction that does `INSERT ... ON CONFLICT DO NOTHING`, then `UPDATE counters SET value = value + 1 ... RETURNING value`, both through the Drizzle query builder. On SQLite, the write lock of that single transaction provides the "no duplicate ids" guarantee.
- **Order placement.** Add a Nitro route, `routes/api/orders.post.ts`. It validates both contacts, wraps id issuance, order build, outbox insert and cart clear in one Drizzle transaction, and returns `{ orderId, email }`.
- **Asynchronous hand-off.** There is no JMS in the pinned stack. An outbox table written in the same SQLite transaction satisfies both "enqueue within the caller's unit of work" and "raise on failure". A separate consumer delivers the XML document to order processing. Treat this as a design proposal. Planning should record it as a Key Decision in ARCHITECTURE.md.
- **Screens.** `src/pages/checkout.tsx` renders the order information form, `src/pages/order-complete.tsx` the confirmation, and the empty-cart Order Error is shown from the order-placement response. Sign-in gating reuses the customer-account capability's session guard.
- **Money.** The legacy code sums in `float`. The rebuild should compute in integer cents (see OQ-3).

## Disputed and low-confidence points (need a human decision)

- **OQ-1: fixed credit card.** Disputed, low confidence. `OrderHTMLAction.java:82` attaches the literal card `1234-2334 / Duke Express / 10/2001` to every order, under the comment `// XXXX this needs to be part of the form`. The checkout form has no card fields. The spec only requires that _a_ card is attached. A human must decide whether it comes from the account's card on file, from new form fields, or from a demo constant.
- **OQ-2: hand-off failure handling.** The pass records disagree:
  - The `apps/petstore` passes say a failure is logged and the order still confirmed.
  - The `asyncsender` passes say it is raised.

  The source shows both happen, depending on the failure:
  - `ServiceLocatorException`, `XMLDocumentException` and `CreateException` are caught and only printed. The cart is still emptied and the customer sees a confirmation for an order that was never sent (`OrderEJBAction.java:154-164`).
  - An `EJBException` from `sendAMessage` is not caught. It rolls back the transaction and surfaces as an unmapped error.

  The spec keeps the "raise" behaviour, because silently losing an order is not a requirement anyone would keep. Confirm this.

- **OQ-3: float money.** `totalCost` is a `float` sum of `float` unit costs (`OrderEJBAction.java:123,137-146`), and the stored total is also a float (`PurchaseOrder.java:308-309`). The rebuild must choose decimal arithmetic and a rounding rule. The legacy code defines no rounding.
- **OQ-4: missing-field handling is broken.** Disputed. `extractContactInfo` records a `MissingFormDataException` in the request and returns `null` (`OrderHTMLAction.java:146-150`). `perform` builds the `OrderEvent` anyway, so `billTo.getEmail()` then throws a `NullPointerException` in the EJB tier. No exception mapping catches that, so the customer gets a server error, not a field message. The billing state label is also mis-built as `"State or Province" + suffix`. The spec states the intended behaviour: reject, place no order, report the missing field. The wording and placement of the message are not defined by the source.
- **OQ-5: billing info lost on persistence.** Disputed, low confidence. `PurchaseOrderEJB.ejbPostCreate` persists only the shipping contact, and `getData` reports it as both billing and shipping (`PurchaseOrderEJB.java:215-219, 267-268`). The spec requires the shipping snapshot only. Whether billing should be persisted separately is open.
- **OQ-6: order id prefix `1001`.** Low confidence. It is a bare literal with no comment or configuration (`OrderEJBAction.java:110`), and it is the only caller of the generator. Order ids therefore collide with nothing, but "1001" followed by 5 is "10015", which reads like a different prefix. Kept as specified for id compatibility.
- **OQ-7: screen-render transaction.** Low confidence, a cross-cutting framework behaviour (`TemplateServlet.java:261-274`). It is stated as SHOULD in the spec. On SQLite a read transaction per render is cheap but optional.
- The error-routing and request-pipeline records are WAF framework mechanisms. The IR filed them under checkout because the empty-cart rejection is delivered through them. They are kept as requirements, but they apply app-wide.

## Non-goals

- Order approval, supplier fulfilment and the confirmation e-mail itself, which belong to order processing and notification.
- Payment authorisation. The legacy code never charges a card.
- Tax, shipping charges and discounts. The legacy code has none.
