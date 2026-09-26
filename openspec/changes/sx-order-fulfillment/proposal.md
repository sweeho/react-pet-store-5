## Why

The legacy Java Pet Store 1.3.2 splits an order's life across three parts: the storefront captures it, the order processing centre (OPC) tracks it through approval and shipment, and the supplier fulfils it from stock and invoices back. None of that fulfilment behaviour is written down anywhere except the legacy code, deployment descriptors and demo docs. Spec extraction SX-0001 recovered it as 39 reviewed IR records under `order-fulfillment`; this change states them as verifiable requirements so the rebuild can match them.

## What Changes

- Adds the `order-fulfillment` capability: the customer purchase order record, its line items, the per-order workflow status and lifecycle, intake at the order processing centre, supplier purchase order generation on approval, invoice-driven completion, and the supplier's stock-based fulfilment and invoicing.
- States the atomicity and retry contract of every asynchronous processing step.
- Records legacy quirks as observed behaviour (single stored contact reused as billing contact, exact-equality completion that never completes an over-shipped order, whole-line-only shipment) and flags each one for a human decision in `design.md`.
- No user interface: no screen records were extracted for this capability.

## Capabilities

### New Capabilities

- `order-fulfillment`: purchase order persistence, order workflow status tracking, approval-to-supplier handoff, supplier fulfilment from inventory, invoicing and order completion.

### Modified Capabilities

- none

## Impact

- Data model: new SQLite tables in `db/schema.ts` for purchase orders, contacts, addresses, credit cards, line items, order workflow status, supplier orders, and a message outbox; one new migration in `drizzle/`.
- Server: new server-only modules (outside the SPA `src/` tree, loaded by Nitro) for order intake, approval handoff, invoice processing and supplier fulfilment, plus an in-process message dispatcher.
- Dependencies on adjacent capabilities: order approval (who decides APPROVED/DENIED), customer notifications (mail content), and supplier inventory (stock records and the stock-update trigger). This change consumes their outputs and does not specify them.
- Security: legacy stores the card number in plain text; the rebuild must not repeat that (see design.md, Risks).
