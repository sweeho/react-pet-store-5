## 1. Data model

- [ ] 1.1 Add purchase order, contact, address and credit card tables to db/schema.ts with the required NOT NULL columns and cascade deletes
- [ ] 1.2 Add the order line item table with immutable attributes, integer-cent unit price and shipped quantity defaulting to 0
- [ ] 1.3 Add the order workflow table keyed by order id with a CHECK over PENDING, APPROVED, DENIED, SHIPPED_PART, COMPLETED
- [ ] 1.4 Add supplier order, supplier contact, supplier address and supplier line item tables with cascade deletes and a status CHECK
- [ ] 1.5 Add the outbox table for pending inter-step messages
- [ ] 1.6 Run db-generate and commit the resulting migration in drizzle/

## 2. Purchase order persistence

- [ ] 2.1 Implement atomic purchase order creation (header, shipping contact, card, lines with shipped 0) using the incoming order id
- [ ] 2.2 Reject a duplicate order id without altering the stored order
- [ ] 2.3 Implement read-back that reports the single stored contact as both billing and shipping contact
- [ ] 2.4 Implement the detached read-only purchase order snapshot
- [ ] 2.5 Expose line-item updates for shipped quantity only, and line creation from an existing line with a stated shipped quantity
- [ ] 2.6 Store the card as a token or last four digits instead of the plain-text number

## 3. Order workflow tracking

- [ ] 3.1 Implement start-tracking with initial PENDING and duplicate rejection
- [ ] 3.2 Implement status read and status update with not-found errors and no implicit create
- [ ] 3.3 Implement list-order-ids-by-status
- [ ] 3.4 Route status changes through the documented lifecycle and make every tracking call join the caller's transaction

## 4. Message dispatch

- [ ] 4.1 Implement the outbox writer that enqueues outbound messages inside the step's transaction
- [ ] 4.2 Implement the dispatcher that delivers committed messages and leaves failed ones for retry, with a retry cap and dead-letter state
- [ ] 4.3 Implement the workflow-step error type preserving the root cause
- [ ] 4.4 Resolve configured channel names and settings at startup and fail fast on a missing one

## 5. Order processing centre

- [ ] 5.1 Implement order intake: store the purchase order then start tracking in PENDING, in one transaction
- [ ] 5.2 Implement approval batch handling: record APPROVED or DENIED and emit one supplier purchase order per approved order with ship-to block and all lines
- [ ] 5.3 Emit one batched customer status notification per approval batch after the supplier purchase orders
- [ ] 5.4 Implement invoice handling: add invoiced shipped quantities by item id and ignore unknown item ids
- [ ] 5.5 Evaluate completion by exact equality and set COMPLETED with a completed-order notice, else SHIPPED_PART

## 6. Supplier fulfilment

- [ ] 6.1 Implement supplier order intake: create with PENDING, shipping contact and lines with shipped 0, atomically
- [ ] 6.2 Implement supplier order lookup by id and by status without duplicates, and cascade delete
- [ ] 6.3 Implement the pure fulfilment function with whole-line shipment, line-number order, missing stock treated as out of stock, and completion flag
- [ ] 6.4 Build the invoice for lines shipped in the attempt with original order date, today's shipping date and the fixed recipient text
- [ ] 6.5 Apply a fulfilment result (stock decrement, shipped quantities, status, invoice message) in one transaction on intake
- [ ] 6.6 Re-fulfil all PENDING supplier orders on a stock-update event, skipping an order whose invoice cannot be built
- [ ] 6.7 Publish each invoice to the order processing centre's invoice channel

## 7. Tests

- [ ] 7.1 Unit-test the fulfilment function for insufficient stock, sufficient stock, missing stock record, partial shipment and re-attempt
- [ ] 7.2 Unit-test invoice application and completion including partial, final and over-shipment cases
- [ ] 7.3 Integration-test workflow tracking: duplicate start, unknown-order read and update, list by status
- [ ] 7.4 Integration-test atomicity: a failing outbound send leaves status and records unchanged and the message retried
- [ ] 7.5 Integration-test the end-to-end flow from intake through approval, supplier fulfilment, stock update and COMPLETED
