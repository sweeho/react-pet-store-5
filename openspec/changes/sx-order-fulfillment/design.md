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
