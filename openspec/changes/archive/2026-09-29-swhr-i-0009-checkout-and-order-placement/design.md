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

## Sprint planning — SWHR-S-0011

Tickets: EPIC SWHR-T-0105, STORY SWHR-T-0106. One TASK per `tasks.md` group: 1 → SWHR-T-0107, 2 → SWHR-T-0108, 3 → SWHR-T-0109, 4 → SWHR-T-0110, 5 → SWHR-T-0111, 6 → SWHR-T-0112, 7 → SWHR-T-0113. Mockups: `artifacts/SWHR-S-0011/design/` (index `MANIFEST.md`).

### Codebase findings

- **No order or counter tables.** `db/schema.ts` has accounts, cart, outbox and supplier-order tables only. The latest migration is `drizzle/0006_parched_may_parker.sql`, so this sprint adds 0007.
- **The outbox already exists.** `lib/messaging/outbox.ts` has `enqueue(tx, channel, payload)`, fixed `SUBSCRIBERS` per `Channel` (`supplier.purchase-order`, `opc.invoice`), and `registerConsumer`. `lib/messaging/dispatcher.ts` `dispatchPending()` runs each handler's commit and the "delivered" mark in one transaction, and retries until `OUTBOX_MAX_ATTEMPTS`. `plugins/outbox-dispatcher.ts` polls it; polling is off under Vitest. No production code calls `registerConsumer` yet.
- **The purchase-order document exists.** `lib/b2b/documents/purchaseOrder.ts` has `writePurchaseOrder(po: PurchaseOrder): string` and `readPurchaseOrder(xml)`. `PurchaseOrder` carries `locale, orderId, userId, emailId, orderDate, shippingInfo, billingInfo, totalPrice (decimal string), creditCard {cardNumber, cardType, expiryDate}, lineItems [{categoryId, productId, itemId, lineNum, quantity, unitPrice (decimal string)}]`.
- **The cart is ready for checkout.** `lib/cart/lines.ts` has `getCart(event, sessionId): Promise<CartView>`, priced at list price in integer minor units, and `emptyCart(sessionId, tx)`, which exists for the order transaction (ARCHITECTURE Key Decision "The cart is priced when it is read").
- **The account has what the form needs.** `lib/account/customer.ts` `getCustomerAccount(userId)` returns `contactInfo {givenName, familyName, telephone, email, address {streetName1, streetName2, city, state, zipCode, country}}` and `creditCard {cardLastFour, cardType, expiryDate}`. Only the last four digits exist (Key Decision). `lib/account/reference.ts` has `COUNTRIES` (PRD decided behaviour 19) and `STATES`. `lib/account/cardNumber.ts` has `maskCardNumber`.
- **Sign-on already gates `/checkout`.** `configs/signon-config.json` lists `/checkout` (`enter_order_information.screen`). `middleware/signon.ts` and `src/components/auth/SignOnGate.tsx` send an anonymous visitor to `/signin`, and sign-in returns them to `session.originalUrl` (e2e SWHR-C-0132, SWHR-C-0236). `requireSignOn(event)` throws 401 for API routes.
- **Placeholders and frames.** `src/pages/checkout.tsx` is a "Coming soon" placeholder with its own test. `src/components/state/` has `ErrorState` and `EmptyState`. `/user-creation-error` is the existing duplicate-account screen. There is no general error page and no central failure-to-screen mapping; routes throw h3 `createError` directly.
- **Money.** `lib/locale/money.ts` `formatPrice(minor, locale)` divides by 100 for USD and CNY and by 1 for JPY. No shared minor-units-to-decimal-string helper exists. `lib/b2b/exchange/supplierIntake.ts` has a private `unitPriceToCents`, which is left alone.
- **Tests.** The Vitest `server` project covers `routes/`, `lib/`, `plugins/` and `middleware/`. Under Vitest, `db/client.ts` is in-memory. `lib/db/migrate.ts` `migrateDatabase(sqlite, folder)` can migrate a second, file-backed connection. CI (`.github/workflows/ci.yml`) already runs on push and pull request to `vortex/**`.

### Planning decisions

- **P1 — Resolved open questions.** These implement the decided behaviours, which PRD constraint 4 says win over the spec.
  - **OQ-1:** the order card is the card on the customer's account (PRD decided behaviour 5). The purchase order's `cardNumber` is the masked form `•••• •••• •••• 4242`, never a full number (Key Decision on last four only), `cardType` is the stored type, and `expiryDate` is `MM/YYYY`. Resolved in `lib/checkout/card.ts` (SWHR-T-0113).
  - **OQ-3:** money is integer minor units everywhere it is stored or computed. The purchase-order document carries decimal strings produced by exact conversion: 2 fraction digits for en_US and zh_CN, 0 for ja_JP, the same split as `formatPrice`. Conversion never goes through a binary float. Resolved in `lib/orders/money.ts` (SWHR-T-0113). The existing Key Decision "Locale-keyed data, no fallback" already states integer minor units, so no new Key Decision is needed for 7.2.
  - **OQ-5:** the stored order keeps one contact, the shipping snapshot (PRD decided behaviour 8). Billing is not persisted separately. It travels only in the document. Resolved in `lib/orders/store.ts` (SWHR-T-0107).
  - **OQ-2:** raise, as the spec says. **OQ-6:** keep the prefix `1001`. **OQ-4:** see SD-1.
- **P2 — Helpers (SWHR-T-0113).**
  - `lib/orders/money.ts` exports `minorToDecimal(minor: number, locale: LocaleId): string` and `decimalToMinor(value: string, locale: LocaleId): number`. `decimalToMinor` throws an error naming the value when there are too many fraction digits or the value is not numeric.
  - `lib/checkout/card.ts` exports `orderCardFromAccount(card: CreditCardValue): CreditCard`, where `CreditCard` is the type from `lib/b2b/elements/creditCard`.
- **P3 — Data model (SWHR-T-0107).** Everything goes in `db/schema.ts` with migration 0007:
  - `counters`: `name` is a text primary key with `CHECK(length(name) <= 255)`; `value` is a non-null integer.
  - `purchaseOrders`: `orderId` text primary key; `userId`, `emailId`, `orderDate` (timestamp_ms), `locale`; `totalValue`, integer minor units, taken from the supplied `totalPrice` and never recomputed; `status`, non-null, default `'PENDING'`, `CHECK IN ('PENDING','APPROVED','DENIED','SHIPPED_PART','COMPLETED')` (PRD decided behaviour 2); `createdAt`.
  - `orderContacts`: one per order, with a unique `orderId` foreign key (cascade); `givenName`, `familyName`, `telephone`, and `email` (nullable).
  - `orderAddresses`: one per contact, with a unique `contactId` foreign key (cascade); `streetName1`, `streetName2` (nullable), `city`, `state`, `zipCode`, `country`.
  - `orderCards`: one per order, with a unique `orderId` foreign key (cascade); `cardNumber` (masked), `cardType`, `expiryDate`.
  - `orderLines`: primary key `(orderId, lineNum)`; `categoryId`, `productId`, `itemId`, `quantity`, and `unitPrice` in integer minor units.
  - `sessions` gains nullable `lastOrderId` and `lastOrderEmail`, read by the order complete screen (P8).
  - `lib/messaging/outbox.ts` gains channel `"opc.purchase-order"` with subscribers `["order-intake"]`. There is no new outbox table (SD-3).
  - `lib/orders/store.ts` exports `persistPurchaseOrder(tx: Executor, po: PurchaseOrder): void`. It writes one order with its shipping-contact snapshot, address, card and lines, and does nothing if `orderId` is already stored, which gives exactly-once delivery. It also exports `getStoredOrder(orderId: string, tx?: Executor): StoredOrder | null`.
- **P4 — Identifiers (SWHR-T-0108).** `lib/ids/counter.ts` exports `ORDER_ID_PREFIX = "1001"` and `nextId(prefix: string, tx?: Executor): string`.
  - It inserts with `INSERT … ON CONFLICT DO NOTHING`, then runs `UPDATE … SET value = value + 1 RETURNING value`, and returns `prefix + value` with no padding.
  - With `tx`, it runs inside the caller's transaction. Without one, it opens its own `db.transaction(…, { behavior: "immediate" })`.
  - A failed counter creation throws `CounterCreationError`, whose message names the prefix.
  - SWHR-C-0278 runs two bun:sqlite connections on a temporary file database migrated with `migrateDatabase`.
- **P5 — Failure kinds and screens (SWHR-T-0112).**
  - `lib/errors/failures.ts` exports `class Failure extends Error { readonly kind: string }` and four subclasses:
    - `GeneralFailure`, kind `"General"`
    - `MissingFormDataFailure extends GeneralFailure`, kind `"MissingFormData"`, with `missing: string[]`
    - `EmptyCartFailure`, kind `"EmptyCart"`
    - `DuplicateAccountFailure`, kind `"DuplicateAccount"`
  - `lib/errors/routing.ts` exports `ERROR_SCREENS`, an ordered list of `[FailureClass, screen, status]`:
    - EmptyCart → `/order-error`, 409
    - DuplicateAccount → `/user-creation-error`, 409
    - General → `/error`, 400
  - The first entry whose class the error is an instance of wins, so a subtype is covered by its parent's entry.
  - `routing.ts` also exports `failureResponse(error: unknown): { status: number; body: FailureBody }`, where `FailureBody = { kind: string; screen: string | null; message: string; missing?: string[] }`.
  - An unmapped error answers status 500, `screen: null` and `message: "Unhandled failure: <kind>"`, where kind is `error.kind ?? error.name`.
  - `routes/api/customers.post.ts` is not changed.
- **P6 — Order placement (SWHR-T-0109).**
  - `lib/checkout/contact.ts` exports `validateOrderContacts(form: OrderForm): { billing: ContactInfo; shipping: ContactInfo }`.
    - `OrderForm = { billing: OrderContactInput; shipping: OrderContactInput }`, and each `OrderContactInput` has string fields `givenName, familyName, streetName1, streetName2, city, state, zipCode, country, telephone, email`.
    - Values are trimmed. A blank required field adds `"<section>.<field>"` (for example `"shipping.telephone"`) to a `MissingFormDataFailure`.
    - A blank `streetName2` becomes `null`, and country is not checked (PRD decided behaviour 7).
  - `lib/checkout/placeOrder.ts` exports `placeOrder(event: H3Event, form: OrderForm, opts?: { now?: Date }): Promise<{ orderId: string; email: string }>`. The steps are:
    1. Validate, then read the cart with `getCart`. An empty cart throws `EmptyCartFailure`.
    2. In one `db.transaction`:
       - re-check that cart lines still exist, throwing `EmptyCartFailure` if not (double submit)
       - call `nextId(ORDER_ID_PREFIX, tx)`
       - build the `PurchaseOrder`, with lines in cart order from `lineNum` 0, `unitPrice` and `totalPrice` from `minorToDecimal`, and the card from `orderCardFromAccount`
       - call `enqueue(tx, "opc.purchase-order", writePurchaseOrder(po))`
       - call `emptyCart(sessionId, tx)`
       - set the session's `lastOrderId` and `lastOrderEmail`
    3. The order e-mail is the billing e-mail, or the account e-mail when billing's is blank (SD-9).
  - `routes/api/orders/index.post.ts`:
    - `requireSignOn` (401)
    - 200 `{ orderId, email }` on success
    - on a thrown error, answers `failureResponse(error)`: status plus `FailureBody`
- **P7 — Intake (SWHR-T-0110).** `lib/orders/intake.ts` exports `createOrderIntakeHandler(): Handler`. Its prepare step is `readPurchaseOrder(payload)`, and its commit step is `(tx) => persistPurchaseOrder(tx, po)`. `plugins/order-intake.ts` registers it with `registerConsumer("opc.purchase-order", "order-intake", …)` at startup. Order approval (swhr-i-0010) extends intake later and must not add a second consumer for this channel.
- **P8 — Screens (SWHR-T-0111).** All screens are built from the mockups in `artifacts/SWHR-S-0011/design/`.
  - `/checkout` (`src/pages/checkout.tsx`) replaces the placeholder:
    - Billing Information and Shipping Information are pre-filled from `GET /api/account`; state and country are selects from `STATES` and `COUNTRIES`.
    - A Payment panel shows the masked account card and links to the account page.
    - Submit is disabled while the request is pending.
    - On a failure, it navigates to `body.screen`.
    - On success, it dispatches `cart:changed` and navigates to `/order-complete`.
  - `/order-complete` reads `GET /api/orders/last`, which answers `{ orderId, email }` from the session through `withReadTransaction`, or 404 when there is none. The page shows the heading, order number, e-mail statement and thank-you line.
  - `/order-error` shows the empty-cart Order Error copy.
  - `/error` is the general error page ("Something went wrong").
  - `lib/db/readTransaction.ts` exports `withReadTransaction<T>(fn: (tx: Executor) => T): T`. If a transaction cannot begin, it runs `fn(db)`. A commit failure is ignored and the result is returned (SD-5).
  - Copy is in en_US, ja_JP and zh_CN.
- **P9 — Sequencing.** SWHR-T-0113 → SWHR-T-0107 → SWHR-T-0108 → SWHR-T-0112 → SWHR-T-0109 → (SWHR-T-0110 ∥ SWHR-T-0111). Each step builds on the previous step's modules. SWHR-T-0110 and SWHR-T-0111 share no files.

### Phases

1. **Helpers** (SWHR-T-0113): exact money conversion and the order card.
2. **Data model** (SWHR-T-0107): migration 0007, the order channel, and `persistPurchaseOrder`.
3. **Identifiers** (SWHR-T-0108).
4. **Error routing** (SWHR-T-0112).
5. **Placement** (SWHR-T-0109): the service and the POST route.
6. **Hand-off and screens**, in parallel: intake consumer and plugin (SWHR-T-0110); pages, the last-order route, and E2E (SWHR-T-0111).
7. **Test harness.** No new Vitest project is needed.
   - New server tests live under `lib/`, `routes/` and `plugins/` (the `server` project); page tests sit next to their pages (`client`).
   - "Queue captured" means reading `outboxMessages` rows for channel `opc.purchase-order` from the in-memory database. A fake clock is the `now` option.
   - SWHR-C-0278 uses a temporary file database with two connections.
   - Every test is titled with its case key (`[SWHR-C-0xxx]`).
   - `e2e/checkout.spec.ts` covers SWHR-C-0257 and SWHR-C-0265 against the Playwright server, which has a fresh database per run through `SQLITE_PATH`.
8. **CI.** `.github/workflows/ci.yml` already triggers on push and pull request to `vortex/**`, `dev` and `main`, and runs the full gate including E2E, so no workflow changes. Test evidence continues through `test:evidence`.

### Spec discrepancies

- **SD-1 — Blank required field.** Scenario SWHR-R-0147.01 says "the telephone number is reported as missing", and task 5.3 asks for per-field messages on the form. PRD decided behaviour 6 and the idea's non-scope say the shopper sees the general error page with no field-level message. The resolution:
  - The API reports the missing fields (`missing: ["shipping.telephone"]` in the 400 body), which satisfies the scenario at the API level.
  - The screen navigates to `/error`, which satisfies decided behaviour 6.
  - Task 5.3 is delivered as that routing.
  - PRD open question 2 already lists the spec correction as owed.
- **SD-2 — Card source.** SWHR-R-0151 only requires "a card". Decided behaviour 5 says it is the account's card, and the Key Decision limits it to the last four digits, so the document's `cardNumber` is masked (P1).
- **SD-3 — Order outbox (task 1.2).** The spec's design proposes a new outbox table. The ARCHITECTURE Key Decision "One outbox for every asynchronous hop" forbids a second queue. Task 1.2 is delivered as the new channel `opc.purchase-order` on the existing outbox tables.
- **SD-4 — Messaging connection (SWHR-R-0154, SWHR-C-0272).** An enqueue here is a row insert in the caller's own SQLite transaction, so no separate messaging connection exists to open or leak. The test makes `enqueue` throw inside a unit of work. It then asserts that the error reaches the caller, that the counter increment and outbox rows are rolled back, and that no transaction is left open: a following `db.transaction` succeeds.
- **SD-5 — Page-render transactions (SWHR-R-0164).** The SPA renders in the browser, where no server transaction exists. The requirement applies to the server read behind the order complete screen, `GET /api/orders/last`, through `withReadTransaction` (P8).
- **SD-6 — Where the order is stored.** The spec's design leaves purchase-order persistence to order processing. The scenarios SWHR-R-0160 and SWHR-R-0161 are in this change, so this sprint builds the tables and `persistPurchaseOrder` and stores orders through the intake consumer (P7). The order-approval change (swhr-i-0010, task 1.1, "add order status values") will find the status column already present, with all five decided statuses.
- **SD-7 — Money literals.** The scenarios state decimals, such as 51.50. The database stores integer minor units (5150), and the document carries decimal strings ("51.50"). Tests assert both forms.
- **SD-8 — Billing contact.** SWHR-R-0149 puts both contacts on the purchase order, and the document carries both. Only the shipping snapshot is stored (SWHR-R-0161, decided behaviour 8).
- **SD-9 — Blank billing e-mail.** E-mail is optional (decided behaviour 7), but the order's contact e-mail and the confirmation statement need an address. When the billing e-mail is blank, the account's stored e-mail is used. This is provisional; the idea canvas lists it as an open question for a human.
- **SD-10 — Empty-cart check order.** The legacy code issues the id before checking the cart. Here, the check runs first and again inside the transaction. The outcome is the same, because a rollback undoes the id.
