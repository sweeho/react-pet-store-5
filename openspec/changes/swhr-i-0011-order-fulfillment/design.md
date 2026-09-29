## Context

See proposal.md for why. The requirements are in `specs/order-fulfillment/spec.md`; this document explains how the legacy system implemented them, how the rebuild on the pinned stack (Vite SPA + Nitro/H3 server, SQLite via better-sqlite3/bun:sqlite + Drizzle) should implement them, and which extracted behaviours are disputed.

Source material: 82 pass records across passes A/B/C in 16 pass files (deduplicated server-side to 39 records), drawn from these legacy modules:

| Legacy module                              | What it contributed                                                                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/purchaseorder`             | Customer purchase order entity, cascade deletes, `PurchaseOrderHelper.processInvoice` (shipment accumulation and completeness test)                                                                          |
| `src/components/lineitem`                  | Line item entity shared by customer and supplier orders; only `quantityShipped` is mutable                                                                                                                   |
| `src/components/processmanager`            | Per-order workflow status record (`ManagerEJB`), status names, `TransitionDelegate` step-handler contract                                                                                                    |
| `src/components/supplierpo`                | Supplier purchase order entity, PENDING on create, status names                                                                                                                                              |
| `src/apps/opc`                             | `PurchaseOrderMDB` (intake), `OrderApprovalMDB` + `OrderApprovalTD` (supplier PO + batched mail), `InvoiceMDB` (completion), DDL in `sun-j2ee-ri.xml`                                                        |
| `src/apps/supplier`                        | `SupplierOrderMDB` (intake), `OrderFulfillmentFacadeEJB` (per-line stock check, invoice building, pending re-fulfilment), `RcvrRequestProcessor` (stock-update trigger), `SupplierOrderTD` (invoice publish) |
| `src/components/servicelocator`            | JNDI lookup, fail-fast `ServiceLocatorException` with root cause                                                                                                                                             |
| `docs/using.html`, `docs/configuring.html` | End-to-end flow and the "re-examine on inventory update" behaviour                                                                                                                                           |

Legacy flow (all hops asynchronous JMS, each `onMessage` container-managed `Required`):

1. Storefront → `jms/opc/OrderQueue` → `PurchaseOrderMDB`: store PO, `createManager(orderId, PENDING)`.
2. Approval batch → `OrderApprovalMDB`: `updateStatus`, build one supplier PO per APPROVED order → `OrderApprovalTD` sends each to `jms/supplier/PurchaseOrderQueue`, then one mail batch to customer relations.
3. Supplier `SupplierOrderMDB`: create supplier order (PENDING), `processAnOrder`, publish invoice on `jms/opc/InvoiceTopic` if anything shipped.
4. Supplier inventory update (`RcvrRequestProcessor`) → `processPendingPO` → publish one invoice per order that shipped.
5. OPC `InvoiceMDB`: `processInvoice`, set COMPLETED (and send completed-order mail) or SHIPPED_PART.

## Goals / Non-Goals

**Goals:**

- Reproduce the observable fulfilment behaviour in the spec: statuses, transitions, shipment arithmetic, invoice content, atomicity.
- Keep the OPC and supplier as separable modules that exchange documents through a channel abstraction, so the asynchronous handoff and retry semantics survive.

**Non-Goals:**

- The approval decision itself (auto-approval thresholds, admin approval) belongs to the order-approval capability.
- Customer notification content and mail transport belong to the notifications capability; this change only raises the notice.
- Supplier inventory management (the stock table and its edit surface) belongs to the inventory capability; this change reads and decrements stock and reacts to the update event.
- Wire-compatible XML documents or JMS. The rebuild is a single monolith.

## User interface

No screen records were extracted for this capability; its user interface is unspecified. Nothing in this change should be built as a page; any order-status or supplier-order surface belongs to another capability's extraction or to a new decision.

## Decisions

**D1. Data model in `db/schema.ts`, one migration in `drizzle/`.** Tables: `purchase_orders` (id text PK = incoming order id, user_id, email, order_date integer ms NOT NULL, locale, total_value NOT NULL), `order_contacts` + `order_addresses` (1:1, cascade), `order_credit_cards` (1:1, cascade), `order_line_items` (FK to order ON DELETE CASCADE, category_id, product_id, item_id, line_number text, quantity integer NOT NULL, unit_price NOT NULL, quantity_shipped integer NOT NULL default 0), `order_workflow` (order_id text PK, status text NOT NULL with a CHECK over the five values), `supplier_orders` (id PK, order_date NOT NULL, status CHECK over four values) with `supplier_contacts`, `supplier_addresses`, `supplier_line_items` (same line shape, cascade). Money as integer cents rather than the legacy single-precision float (see R2). Run `db-generate` and commit the migration. Alternative considered: one shared line-item table for both order kinds as in legacy (`LineItemEJB` is reused); rejected because the two sides are separate systems and should not share rows.

**D2. Line-item immutability enforced in the data-access module**, not by triggers: the module exports an update function for `quantity_shipped` only. Legacy enforced this by exposing a single setter on the local interface.

**D3. Asynchronous hops become a SQLite outbox + in-process dispatcher.** Each step runs inside one `db.transaction()` that writes its record changes and inserts its outbound messages into an `outbox` table; a dispatcher delivers committed rows to the next handler, and a handler that throws leaves the row undelivered for retry. This preserves "atomic with outbound messages, retried on failure" (legacy: `Required` MDBs + transacted JMS session) without a broker. Alternative: direct synchronous calls; rejected because it loses the storefront-returns-before-fulfilment and retry semantics. Delivery needs a retry cap and a dead-letter state; legacy had none (redelivery was left to the container), so the cap value is a new decision to record in ARCHITECTURE.md Key Decisions.

**D4. Supplier fulfilment is a pure function over (order lines, stock snapshot)** returning shipped lines, new stock levels, completion flag and invoice, then applied in one transaction. That makes the whole-line rule, line-order stock consumption and invoice content unit-testable without the database.

**D5. Step handlers and dependency resolution.** The legacy `TransitionDelegate` / `ServiceLocator` layer maps to plain module imports plus a typed error class carrying `cause`. Configured names (channel names, settings) are read once at startup and a missing one throws immediately, with no fallback.

**D6. Status transitions are guarded in code.** Legacy `updateStatus` overwrites unconditionally; the rebuild keeps the same API but routes callers through the lifecycle in the spec. Whether to reject illegal transitions (e.g. DENIED → COMPLETED) is open (F7).

## Risks / Trade-offs

Findings from the extraction, each a disputed or low-confidence area a human should rule on. The spec states the legacy behaviour; the rebuild follows it unless a finding is resolved otherwise.

- **F1. Billing contact is dropped.** `PurchaseOrderEJB.ejbPostCreate` stores only the shipping contact, and `getData` returns it as billing too (code comment `// XXX`). Likely a legacy defect. → Confirm before building; if billing must be kept, add a second contact and MODIFY the "Single stored contact" requirement.
- **F2. Over-shipment never completes an order.** Completion is `quantity == quantityShipped`; an invoice that over-reports leaves the order in SHIPPED_PART forever. → Decide whether `>=` is intended.
- **F3. Shipments are keyed by item id, not line.** `processInvoice` adds the invoiced quantity to every line carrying that item id, so an order with two lines for the same item double-counts. → Rebuild could key invoices by line number; needs a decision since the invoice document carries line numbers.
- **F4. Line order decides who gets scarce stock.** Supplier evaluates lines in collection order with no reservation; order of the legacy collection is unspecified. → Spec says "in order"; the rebuild should order by line number and record that.
- **F5. Card number stored in plain text** (`CreditCardEJBTable.cardNumber VARCHAR`). Regulated risk. → Rebuild must store a token or last-four only; the spec does not require the full number to be retrievable.
- **F6. Supplier APPROVED / DENIED are dead values.** Declared in supplier `OrderStatusNames` but never written or read by the supplier app. → Kept in the allowed set; confidence low.
- **F7. Lifecycle is documented, not enforced.** Only Javadoc states PENDING → APPROVED → SHIPPED_PART → COMPLETED / PENDING → DENIED; `setStatus` accepts anything. Confidence low.
- **F8. Money is single-precision float** (`unitPrice REAL`, `float`). → Integer cents in the rebuild (D1); rounding behaviour of the legacy totals is not part of this capability.
- **F9. Fixed invoice recipient text** "Dear PetStore Customer" replaces the user id. Kept verbatim; it is a legacy demo artefact.
- **F10. Transition-handler and service-locator records are plumbing** filed under this capability as the closest fit (both low/medium confidence). They are expressed as two small error-contract requirements, not as architecture.
- **F11. No retry cap.** Legacy retry relied on container redelivery with no documented limit; D3 introduces one.

## Migration Plan

Greenfield in the rebuild; no data migration from the legacy database is in scope.

## Open Questions

- Retry cap and dead-letter handling for the outbox (D3/F11).
- Whether SHIPPED_PART → SHIPPED_PART repeated updates should be recorded as history (legacy keeps only the current status).

## Sprint planning — SWHR-S-0014

This section was added at sprint planning (SWHR-T-0131). The sections above describe the change as it was extracted from the legacy system. This section describes the repository as it stands, on sprint base `460755e` (SWHR-S-0012 landed), and fixes the interfaces the seven tickets code against. Where this section and D1–D6 disagree, this section wins, and the disagreement is listed under Spec discrepancies.

### Codebase findings

Much of this change already exists, built by earlier capabilities:

| Change asks for                                     | Already in the repo                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purchase order, contact, address, card, line tables | `purchaseOrders`, `orderContacts`, `orderAddresses`, `orderCards`, `orderLines` in `db/schema.ts` (checkout, migration 0007). Children cascade on delete. The card is stored masked (`lib/checkout/card.ts`). Lines have no shipped quantity.                                                                                               |
| Order status                                        | The `purchaseOrders.status` column with a CHECK over the five values. Written by `lib/orders/approval.ts` (conditional update from PENDING), read by `lib/orders/adminData.ts` and `lib/orders/store.ts`.                                                                                                                                   |
| Supplier order tables                               | `supplierOrders`, `supplierContacts`, `supplierAddresses`, `supplierLineItems` (partner document exchange). Their foreign keys have no `ON DELETE CASCADE`.                                                                                                                                                                                 |
| Outbox, dispatcher, retry cap, dead letter          | `lib/messaging/outbox.ts`, `dispatcher.ts` and `plugins/outbox-dispatcher.ts`. `OUTBOX_MAX_ATTEMPTS` defaults to 10, then the delivery is marked `dead`.                                                                                                                                                                                    |
| OPC intake                                          | `lib/orders/intake.ts` stores the order (idempotent `persistPurchaseOrder`) and enqueues auto-approval, registered by `plugins/order-intake.ts`.                                                                                                                                                                                            |
| Approval → supplier PO + batched notice             | `lib/orders/approval.ts` `applyApprovalBatch`: one `supplier.purchase-order` message per approval (partner format), then one `opc.approval-notice` per batch.                                                                                                                                                                               |
| Supplier intake                                     | `lib/b2b/exchange/supplierIntake.ts` stores a supplier order as PENDING, with a `shipOnReceipt` hook that defaults to shipping nothing. **No plugin registers it**, so every supplier PO sent since SWHR-S-0012 is still pending in the outbox.                                                                                             |
| Invoice document                                    | `buildPartnerInvoice` (`lib/b2b/partner/tpaInvoice.ts`) and `readPartnerInvoice` (`lib/b2b/partner/invoiceIntake.ts`, returning `{ orderId, shipped: itemId → quantity }`). `publishInvoices` enqueues on `opc.invoice`, which has subscribers `order-fulfillment` and `customer-notification`. **No `order-fulfillment` consumer exists.** |
| Stock                                               | Nothing. The stock table belongs to change `swhr-i-0012-supplier-inventory` (its D1: `itemId` PK, `quantity` integer NOT NULL, no CHECK). `architecture/rebuild-guidance.md` §2 says fulfilment builds it first.                                                                                                                            |

### Decisions (fixed interfaces)

Every signature below is a contract between tickets. A ticket that needs to change one escalates to planning instead.

- **P1 — Schema (task group 1).** Add `orderWorkflow` (`orderId` text PK, `status` text NOT NULL, CHECK over PENDING, APPROVED, DENIED, SHIPPED_PART, COMPLETED, and no foreign key, as in the legacy system, so tracking can start before or without a stored order). Add `orderLines.quantityShipped` integer NOT NULL default 0. Rebuild `supplierContacts`, `supplierAddresses` and `supplierLineItems` with `ON DELETE CASCADE`. Add `supplierInventory` (`itemId` text PK, `quantity` integer NOT NULL, no CHECK) in exactly the shape of supplier-inventory D1, which must not create it again. One generated migration, 0008. `purchaseOrders.status` is not touched here (P3 moves it).
- **P2 — Purchase order store (`lib/orders/store.ts`).** `createPurchaseOrder(tx, po): void` writes the header, the single shipping contact, the card and every line with `quantityShipped` 0. It throws `DuplicateOrderError` (new, `lib/orders/errors.ts`) for a known id and writes nothing. `persistPurchaseOrder(tx, po): boolean` keeps its idempotent contract for intake redelivery by checking existence, then calling `createPurchaseOrder`. `getStoredOrder(orderId, tx?)` stays the detached snapshot. It adds `billingContact` and `shippingContact` (both built from the one stored contact and address, SWHR-R-0195), and `quantityShipped` on each line. Line access lives in `lib/orders/lines.ts`: `setShippedQuantity(tx, orderId, lineNum, quantityShipped): void` is the only line update, and the pure `copyLine(line, quantityShipped): OrderLine` builds a line from another. There is no API that changes item, quantity, price, category, product or line number.
- **P3 — Workflow tracking (`lib/orders/workflow.ts`).**
  - `type OrderStatus`.
  - `startTracking(tx, orderId): void` inserts PENDING and throws `WorkflowCreateError` when a record exists.
  - `getStatus(tx, orderId): OrderStatus` and `updateStatus(tx, orderId, status): void` both throw `OrderNotFoundError` for an unknown id, and `updateStatus` never inserts.
  - `transition(tx, orderId, to): boolean` is a conditional update allowed only along the lifecycle (PENDING→APPROVED or DENIED; APPROVED→SHIPPED_PART or COMPLETED; SHIPPED_PART→SHIPPED_PART or COMPLETED). It returns false otherwise.
  - `listOrderIdsByStatus(tx, status): string[]`.
  - Every function takes the caller's executor, so it joins the step's transaction.

  This ticket moves the status. Migration 0009 is generated, with one hand-added `INSERT INTO orderWorkflow SELECT orderId, status FROM purchaseOrders` before the column drop. `persistPurchaseOrder` calls `startTracking`. `applyApprovalBatch` uses `transition`. `adminData.ts` and `getStoredOrder` read status from `orderWorkflow`. The admin order-data API answers exactly as before.

- **P4 — Message dispatch (`lib/messaging/`).**
  - `errors.ts`: `WorkflowStepError(step, cause)` and `DependencyResolutionError(name, cause)`, both setting `.cause`.
  - `runStep(step, fn)` rethrows any error from `fn` as a `WorkflowStepError` whose `cause` is the original.
  - `channels.ts`: `resolveChannel(name, registry?)` returns a `Channel` or throws `DependencyResolutionError` at once, with the lookup failure as `cause` and no fallback. Plugins resolve their channels at registration.
  - `outbox.ts` gains channel `opc.completed-order` with subscriber `customer-notification`. The payload is the order id as plain text, as the legacy InvoiceMDB forwarded it.
  - The outbox writer, dispatcher, retry cap and dead letter already exist. Tasks 4.1 and 4.2 are verified, not rebuilt.
- **P5 — Order processing centre (`lib/orders/`).**
  - `invoice.ts`: `applyInvoice(tx, orderId, shipped): "COMPLETED" | "SHIPPED_PART"`. It adds each invoiced quantity to every line with that item id (legacy F3) and ignores unknown item ids. It then compares every line's shipped quantity to its ordered quantity with exact equality (F2): all equal means `transition` to COMPLETED and one `opc.completed-order` notice; otherwise `transition` to SHIPPED_PART. An unknown order id throws `OrderNotFoundError`, so the delivery retries and goes dead.
  - `createOrderFulfillmentHandler()` is the `order-fulfillment` consumer on `opc.invoice`. It reads with `readPartnerInvoice` and applies inside `runStep`. `plugins/order-fulfillment.ts` registers it.
  - `applyApprovalBatch` runs its commit inside `runStep` as well.
- **P6 — Supplier fulfilment (`lib/supplier/`, new).**
  - `fulfilment.ts`: `fulfil(lines, stock, now?)` is pure. It evaluates only unshipped lines, in ascending line number. A line ships whole when stock for its item covers its full quantity; a missing stock record counts as 0. It returns `{ shipped, stock, completed }`.
  - `buildSupplierInvoice(order, shippedLines, now): PartnerInvoice` sets `userId` to "Dear PetStore Customer" (F9), keeps the original order date, sets the shipping date to `now`, and includes only the shipped lines.
  - `stock.ts`:
    - `fulfilSupplierOrder(tx, orderId, now): PartnerInvoice | null` applies stock decrements, shipped quantities and COMPLETED in the caller's transaction.
    - `refulfilPendingSupplierOrders(tx, now): PartnerInvoice[]` runs each PENDING order in ascending order id, each in its own savepoint (`tx.transaction`), so an order whose fulfilment or invoice build throws is rolled back and skipped (SWHR-R-0220.02).
    - `applyStockUpdate(tx, updates, now)` sets absolute quantities, re-fulfils and publishes. It is the seam supplier-inventory's route calls; that change owns the input rules.
  - `listSupplierOrderIdsByStatus(status)` is added to `supplierOrders.ts`, which also returns lines in line-number order.
  - `plugins/supplier-intake.ts` registers `createSupplierIntakeHandler({ shipOnReceipt })`.
  - `db/seed/inventory.ts` seeds EST-1 to EST-29 at 10000 once per fresh database, like the catalog. That is supplier-inventory's shipped seed data; its initial-load operation stays in that change.
- **P7 — Order of work.** 1 → 2 → 3 → 5 → 6 → 7, with 4 after 1 and in parallel with 2 and 3. Each later group's files are disjoint from any group it runs in parallel with (see each PLAN.md).

### Spec discrepancies

These are recorded as observed. Nothing in the delta spec was edited.

- **SD-1 — Status home.** D1 and SWHR-R-0200 want a separate order-workflow record. The repo keeps status on `purchaseOrders` (checkout SD-6, order-approval SD-1). The approved cases SWHR-C-0351 and SWHR-C-0355 need a tracking record that exists apart from the order, so P1/P3 move the status to `orderWorkflow` and drop the column. The ARCHITECTURE entity line changes with it.
- **SD-2 — Already built.** Tasks 1.1, 1.5, 4.1, 4.2, 5.1–5.3, 6.1, 6.7 and 2.6 are largely satisfied by existing code (see Codebase findings). Their tickets add the missing pieces and the scenario tests; they do not rebuild. In particular the card number is already masked (F5 resolved).
- **SD-3 — Duplicate order id.** SWHR-R-0193.02 says a second store fails. Intake needs redelivery to be a no-op (checkout's exactly-once rule). P2 has both: `createPurchaseOrder` throws, and `persistPurchaseOrder` checks first.
- **SD-4 — Supplier boundary (PRODUCT Open question 3).** The question is open in PRODUCT.md, but the code has already taken option (a) in-process. Supplier orders and invoices cross as partner XML documents over the outbox (swhr-i-0004, swhr-i-0010). This sprint builds on that. Switching to internal message shapes would be a local change in `lib/b2b/exchange/`. A human should confirm.
- **SD-5 — Stock table ownership.** Fulfilment creates `supplierInventory` and its seed data (P1, P6), in the shape swhr-i-0012 D1 prescribes, as `architecture/rebuild-guidance.md` §2 directs.
- **SD-6 — Stock-update trigger.** SWHR-R-0220 and SWHR-R-0221 need a stock-update event. The inventory edit surface ships with swhr-i-0012, so this sprint provides `applyStockUpdate` and proves the scenarios through it at integration level. **SWHR-C-0385 (e2e, "Raise EST-6 stock through the supplier inventory update") cannot run until that surface exists.** A human must re-level it to integration or defer it to swhr-i-0012.
- **SD-7 — Completed-order notice channel.** The spec says a notice is "raised" and names no channel. P4 adds `opc.completed-order`. Customer notifications (swhr-i-0013) consumes it, and until then its deliveries stay pending, like `opc.approval-notice`.
- **SD-8 — Lifecycle guard (F7).** The spec states the lifecycle, and legacy `updateStatus` overwrites unconditionally. P3 keeps `updateStatus` unguarded (SWHR-R-0203) and routes the approval and invoice steps through the guarded `transition`. An invoice for an order that is not APPROVED or SHIPPED_PART therefore changes its lines but not its status.
- **SD-9 — Names and types.** D1 uses snake_case table names and a text line number. The repo's tables are camelCase with an integer `lineNum`, and new tables follow the repo.
- **SD-10 — Invoice unit price.** Supplier lines hold integer cents. The invoice writes `unitPrice` as cents/100 with two decimals whatever the locale. The OPC reads only item id and quantity from an invoice, so nothing depends on it.

### Phases

1. **Data model** (group 1). Schema and migration 0008.
2. **Store** (group 2). Order persistence, line access, snapshot.
3. **Workflow** (group 3). Tracking module and the status move (migration 0009).
4. **Dispatch** (group 4). Step errors, channel resolution, the completed-order channel.
5. **OPC** (group 5). Invoice consumer, completion, approval step wrapping.
6. **Supplier** (group 6). Fulfilment, re-fulfilment, supplier intake registration, stock seed.
7. **Test harness** (group 7). The end-to-end integration scenario in `lib/b2b/scenarios/order-fulfillment.test.ts` drives dispatcher rounds from intake to COMPLETED, including a stock update. `e2e/order-fulfillment.spec.ts` covers SWHR-C-0340 through checkout and the admin order views with seeded stock. It also audits that 7.1–7.4 are covered by the tests groups 3, 5 and 6 wrote, and fills any gap.
8. **CI.** No workflow change is needed. `.github/workflows/` already triggers on pushes and pull requests to `vortex/**` and runs the unit and Playwright suites with JUnit reports. The new specs land in those jobs by path: `lib/**` in the Vitest `server` project, `e2e/**` in Playwright.

### Risks

- Migrations 0008 and 0009 rebuild tables that other tables reference. `migrateDatabase` runs them with foreign keys off and checks `foreign_key_check` afterwards (swhr-s-0009), so a populated database upgrades safely. Each migration ticket adds an upgrade test from a populated database.
- The status move touches order-approval code shipped last sprint. Its route and E2E tests (`routes/api/admin/order-data.test.ts`, `e2e/order-approval.spec.ts`) are the regression guard and must stay green unchanged.
- Once `plugins/supplier-intake.ts` registers, every supplier PO already pending in a deployed outbox is processed.
