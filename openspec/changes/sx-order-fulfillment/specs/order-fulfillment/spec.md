## ADDED Requirements

### Requirement: Order capture is separated from order processing and supplier fulfilment

The system SHALL hand each order placed in the storefront to an order processing centre asynchronously, the order processing centre SHALL obtain fulfilment of approved orders from a supplier, and the supplier SHALL fulfil from its own inventory and send an invoice for what it shipped back to the order processing centre.

#### Scenario: A placed order flows to the supplier and is invoiced back

- **GIVEN** a customer places an order that is approved
- **WHEN** the order is processed end to end
- **THEN** the storefront submission returns without waiting for fulfilment, the supplier receives a purchase order for it, and the order processing centre receives an invoice for every shipment the supplier makes

### Requirement: Purchase order record

The system SHALL store each customer purchase order with a unique order identifier, the ordering customer's user id, the customer email address, a mandatory order date held as a millisecond timestamp, the order locale and a mandatory order total value, together with exactly one contact (given name, family name, email, telephone) holding exactly one address (street 1, street 2, city, state, country, postal code), exactly one credit card (number, type, expiry date) and one or more line items. The order identifier MUST be the one supplied on the incoming order; the system SHALL NOT generate one.

#### Scenario: Order stored under its incoming identifier

- **GIVEN** an incoming order with identifier `1001`, two line items and a total value of 72.50
- **WHEN** the order is stored
- **THEN** it is retrievable by identifier `1001` with its user id, email, date, locale, total value, contact, address, credit card and both line items

#### Scenario: Duplicate order identifier rejected

- **GIVEN** a stored purchase order with identifier `1001`
- **WHEN** another order with identifier `1001` is stored
- **THEN** the second store fails and the first order is unchanged

### Requirement: Purchase order creation is atomic

WHEN a purchase order is created, the system SHALL store in one transaction the order header, one contact taken from the order's shipping information, the order's credit card, and one line item per incoming line with its shipped quantity initialised to 0. IF any dependent record cannot be created THEN the whole creation MUST fail and nothing of the order SHALL remain stored.

#### Scenario: Lines start unshipped

- **GIVEN** an incoming order with lines for 2 units of item `EST-1` and 1 unit of item `EST-6`
- **WHEN** the order is created
- **THEN** both stored lines have shipped quantity 0 and carry their incoming category, product, item, line number, quantity and unit price

#### Scenario: Dependent record failure rolls back the order

- **GIVEN** an incoming order whose credit card record cannot be created
- **WHEN** the order is created
- **THEN** creation fails and no order header, contact or line item for it is stored

### Requirement: Single stored contact serves as billing and shipping contact

The system SHALL persist only the shipping contact of a purchase order, and WHEN a stored purchase order is read back the system SHALL report that single stored contact as both its billing contact and its shipping contact.

#### Scenario: Billing contact differs from shipping contact on intake

- **GIVEN** an incoming order whose billing contact is "A. Buyer" and whose shipping contact is "B. Receiver"
- **WHEN** the order is stored and then read back
- **THEN** both the billing and the shipping contact read back as "B. Receiver"

### Requirement: Purchase order deletion removes its dependents

WHEN a purchase order is deleted, the system SHALL also delete its contact, that contact's address, its credit card and all of its line items. Each of these dependent records MUST belong to exactly one purchase order.

#### Scenario: Deleting an order

- **GIVEN** a stored purchase order with one contact, one address, one credit card and three line items
- **WHEN** the purchase order is deleted
- **THEN** none of the contact, address, credit card or line items remain stored

### Requirement: Purchase order snapshot

The system SHALL provide, for any stored purchase order, a read-only snapshot of its header, contact, credit card and line items (category, product, item, line number, quantity, unit price and shipped quantity) that remains usable after the unit of work that loaded it has ended.

#### Scenario: Snapshot read after the loading transaction ends

- **GIVEN** a stored purchase order with two line items, one of which has shipped quantity 2
- **WHEN** a snapshot is taken and the loading unit of work ends
- **THEN** the snapshot still returns both lines with their shipped quantities 0 and 2 and all header, contact and card fields

### Requirement: Line item attributes and immutability

The system SHALL store each order line with a category id, product id, item id, line number, a mandatory whole-number ordered quantity, a mandatory unit price and a mandatory whole-number shipped quantity. The unit price MUST be the price recorded when the line is created and SHALL NOT change afterwards. After creation only the shipped quantity MAY be changed; category, product, item, line number, ordered quantity and unit price SHALL be read-only.

#### Scenario: Catalog price change does not alter a stored line

- **GIVEN** a stored line for item `EST-1` at unit price 16.50
- **WHEN** the catalog price of `EST-1` changes to 18.50
- **THEN** the stored line still carries unit price 16.50

#### Scenario: Attempt to change a fixed attribute

- **GIVEN** a stored line with ordered quantity 3
- **WHEN** a change to its ordered quantity is requested
- **THEN** the change is not possible and the ordered quantity remains 3

### Requirement: Line item creation requires an initial shipped quantity

The system SHALL require the initial shipped quantity whenever a line item is created, either together with all other attributes or together with an existing line description; WHEN created from an existing line description the system SHALL copy its category, product, item, line number, ordered quantity and unit price unchanged and SHALL set the shipped quantity to the stated value, never to the source's shipped quantity.

#### Scenario: Line copied with a stated shipped quantity

- **GIVEN** an existing line for 4 units of item `EST-2` at 12.00 with shipped quantity 4
- **WHEN** a new line is created from it with stated shipped quantity 0
- **THEN** the new line has 4 units of `EST-2` at 12.00, the same category, product and line number, and shipped quantity 0

### Requirement: Order workflow status record

The system SHALL keep exactly one workflow status record per customer order, keyed by the order identifier, whose status MUST be one of PENDING (placed, not yet approved), APPROVED, DENIED, SHIPPED_PART (part of the order has shipped) or COMPLETED (the whole order has shipped).

#### Scenario: One status per order

- **GIVEN** an order `1001` whose workflow status is APPROVED
- **WHEN** its status is read
- **THEN** exactly one status, APPROVED, is returned

### Requirement: Order workflow lifecycle

The system SHALL move an order through the lifecycle PENDING → APPROVED → SHIPPED_PART → COMPLETED, or PENDING → DENIED. An approved order MAY go directly to COMPLETED when its first shipment completes it, and an order in SHIPPED_PART SHALL remain in SHIPPED_PART after further partial shipments until it is complete.

#### Scenario: Approval

- **GIVEN** an order in PENDING
- **WHEN** it is approved
- **THEN** its status becomes APPROVED

#### Scenario: Denial

- **GIVEN** an order in PENDING
- **WHEN** it is denied
- **THEN** its status becomes DENIED

#### Scenario: Partial then complete shipment

- **GIVEN** an approved order with two lines
- **WHEN** a shipment covering only the first line is recorded, and later a shipment covering the second line is recorded
- **THEN** the status becomes SHIPPED_PART after the first shipment and COMPLETED after the second

### Requirement: Starting order workflow tracking

WHEN a new purchase order is received, the system SHALL start its workflow tracking by recording the order identifier with an initial status of PENDING. IF a tracking record already exists for that order identifier THEN the system MUST reject the request with a creation error and leave the existing record unchanged.

#### Scenario: Tracking started for a new order

- **GIVEN** no tracking record for order `1001`
- **WHEN** tracking is started for `1001`
- **THEN** a record for `1001` exists with status PENDING

#### Scenario: Tracking started twice

- **GIVEN** a tracking record for order `1001` with status APPROVED
- **WHEN** tracking is started again for `1001`
- **THEN** the request fails with a creation error and the status of `1001` is still APPROVED

### Requirement: Reading and updating order workflow status

The system SHALL return the current status of an order by its identifier and SHALL replace the current status of an existing order with a new status. IF no tracking record exists for the identifier THEN both the read and the update MUST fail with a not-found error, and an update SHALL NOT create a record.

#### Scenario: Status update of an existing order

- **GIVEN** order `1001` in status PENDING
- **WHEN** its status is updated to APPROVED
- **THEN** reading the status of `1001` returns APPROVED

#### Scenario: Status update of an unknown order

- **GIVEN** no tracking record for order `9999`
- **WHEN** a status update to APPROVED is requested for `9999`
- **THEN** the update fails with a not-found error and no record for `9999` exists afterwards

#### Scenario: Status read of an unknown order

- **GIVEN** no tracking record for order `9999`
- **WHEN** the status of `9999` is read
- **THEN** the read fails with a not-found error

### Requirement: Listing orders by workflow status

The system SHALL list the identifiers of all orders currently in a given workflow status.

#### Scenario: Orders listed by status

- **GIVEN** orders `1001` and `1003` in PENDING and order `1002` in APPROVED
- **WHEN** orders in PENDING are listed
- **THEN** exactly `1001` and `1003` are returned

### Requirement: Workflow tracking operations are transactional

The system SHALL perform every workflow-tracking operation (start, update, read, list) within the caller's unit of work when one is active and within its own otherwise, so that a status change commits or rolls back together with the order processing that caused it.

#### Scenario: Status change rolled back with its triggering step

- **GIVEN** order `1001` in PENDING
- **WHEN** an approval step updates its status to APPROVED and then fails before completing
- **THEN** the status of `1001` is still PENDING

### Requirement: Order intake at the order processing centre

WHEN the order processing centre receives a purchase order from the storefront, the system SHALL store the purchase order (header, contact, credit card and line items) and SHALL then start its workflow in status PENDING before any approval decision is taken.

#### Scenario: New order received

- **GIVEN** the storefront submits order `1001`
- **WHEN** the order processing centre handles it
- **THEN** order `1001` is stored and its workflow status is PENDING before approval is evaluated

### Requirement: Supplier purchase order generation on approval

WHEN an order is approved, the system SHALL record its APPROVED status and SHALL send exactly one supplier purchase order for it, carrying the order identifier, the order date, a ship-to block (given name, family name, street line 1, city, state, country, postal code, email, telephone) and, for every order line, the category id, product id, item id, line number, quantity and unit price. WHEN an order is denied, the system SHALL record its DENIED status and SHALL NOT send a supplier purchase order.

#### Scenario: Approved order produces one supplier purchase order

- **GIVEN** a PENDING order `1001` with two lines
- **WHEN** it is approved
- **THEN** its status is APPROVED and exactly one supplier purchase order for `1001` is sent containing the ship-to block and both lines

#### Scenario: Denied order produces no supplier purchase order

- **GIVEN** a PENDING order `1002`
- **WHEN** it is denied
- **THEN** its status is DENIED and no supplier purchase order for `1002` is sent

### Requirement: Batched customer status notification after an approval batch

WHEN a batch of approval decisions is processed, the system SHALL include every order whose status the batch changed, approved or denied, in a single customer status notification, and SHALL dispatch that notification only after the supplier purchase orders for the batch have been sent.

#### Scenario: Mixed approval batch

- **GIVEN** an approval batch that approves order `1001` and denies order `1002`
- **WHEN** the batch is processed
- **THEN** one supplier purchase order for `1001` is sent first, followed by one notification covering both `1001` and `1002`

### Requirement: Recording supplier shipments against an order

WHEN a supplier invoice for an order is received, the system SHALL, for each item identifier on the invoice, add the invoiced shipped quantity to the shipped quantity of every line of that order carrying that item identifier, and SHALL ignore invoiced item identifiers that match no line of the order.

#### Scenario: Invoice applied to matching lines

- **GIVEN** order `1001` with a line for 2 units of `EST-1` (shipped 0) and a line for 1 unit of `EST-6` (shipped 0)
- **WHEN** an invoice for `1001` reports 2 units of `EST-1` shipped
- **THEN** the `EST-1` line has shipped quantity 2 and the `EST-6` line still has shipped quantity 0

#### Scenario: Invoice for an item not on the order

- **GIVEN** order `1001` with no line for item `EST-99`
- **WHEN** an invoice for `1001` reports 5 units of `EST-99` shipped
- **THEN** no line of `1001` changes because of `EST-99`

### Requirement: Order completion evaluation on invoice receipt

After applying a supplier invoice, the system SHALL treat the order as completely fulfilled only when every line's shipped quantity equals its ordered quantity exactly. IF the order is completely fulfilled THEN its status SHALL become COMPLETED and a completed-order notice MUST be raised for the customer; OTHERWISE its status SHALL become SHIPPED_PART and no completed-order notice SHALL be raised.

#### Scenario: Final invoice completes the order

- **GIVEN** order `1001` whose `EST-1` line is fully shipped and whose `EST-6` line (1 unit) has shipped 0
- **WHEN** an invoice for `1001` reports 1 unit of `EST-6` shipped
- **THEN** the status of `1001` becomes COMPLETED and one completed-order notice for `1001` is raised

#### Scenario: Partial invoice

- **GIVEN** order `1001` with two lines, neither shipped
- **WHEN** an invoice for `1001` covers only one line in full
- **THEN** the status of `1001` becomes SHIPPED_PART and no completed-order notice is raised

#### Scenario: Over-shipment is not completion

- **GIVEN** order `1001` with a single line for 2 units that has shipped 0
- **WHEN** an invoice for `1001` reports 3 units of that item shipped
- **THEN** the line's shipped quantity is 3, the status of `1001` becomes SHIPPED_PART and no completed-order notice is raised

### Requirement: Order processing steps are atomic and retried

Each order processing step (order intake, approval batch processing, invoice processing, each customer notification, and supplier purchase order intake) SHALL be atomic with the outbound messages it emits: its record changes and outbound messages MUST all take effect or none do. IF any part of a step fails THEN no partial change or outbound message SHALL remain and the inbound message SHALL be retried rather than treated as processed.

#### Scenario: Failure while sending after a status change

- **GIVEN** an approval batch that approves order `1001`
- **WHEN** sending the supplier purchase order for `1001` fails
- **THEN** `1001` remains PENDING, no supplier purchase order or notification for the batch is delivered, and the batch is processed again later

#### Scenario: Unparseable supplier purchase order

- **GIVEN** a supplier purchase order message that cannot be parsed
- **WHEN** the supplier handles it
- **THEN** no supplier order is stored and the message is not consumed as processed

### Requirement: Supplier purchase order record

The supplier SHALL store each supplier purchase order under a unique order identifier with a mandatory order date, a status, exactly one shipping contact with its address, and one or more line items each carrying category id, product id, item id, line number, a mandatory ordered quantity, a mandatory shipped quantity and a mandatory unit price. The supplier SHALL retrieve a supplier purchase order by its identifier and SHALL list, without duplicates, all supplier purchase orders in a given status.

#### Scenario: Supplier orders listed by status

- **GIVEN** supplier orders `1001` and `1003` in PENDING and `1002` in COMPLETED
- **WHEN** supplier orders in PENDING are listed
- **THEN** `1001` and `1003` are each returned exactly once

### Requirement: Supplier purchase order creation

WHEN a supplier purchase order is created, the supplier SHALL copy the order identifier and order date from the incoming order, SHALL set the status to PENDING regardless of the incoming data, and SHALL store a new shipping contact from the order's shipping information and one line item per incoming line with shipped quantity 0, all in one transaction. IF any part cannot be created THEN the whole creation MUST fail.

#### Scenario: Supplier order created as pending

- **GIVEN** an incoming supplier purchase order `1001` with two lines
- **WHEN** it is created
- **THEN** supplier order `1001` has status PENDING, one shipping contact, and two lines each with shipped quantity 0

### Requirement: Supplier purchase order statuses

A supplier purchase order status SHALL be one of PENDING (received, not yet fully fulfilled), APPROVED, DENIED or COMPLETED. Supplier fulfilment SHALL move an order only from PENDING to COMPLETED.

#### Scenario: Fulfilled supplier order

- **GIVEN** a supplier order in PENDING
- **WHEN** a fulfilment attempt ships every outstanding line
- **THEN** its status becomes COMPLETED

### Requirement: Supplier purchase order deletion removes its dependents

WHEN a supplier purchase order is deleted, the supplier SHALL also delete its shipping contact, that contact's address and all of its line items.

#### Scenario: Deleting a supplier order

- **GIVEN** a supplier order with a contact, an address and two line items
- **WHEN** the supplier order is deleted
- **THEN** none of the contact, address or line items remain stored

### Requirement: Supplier handling of a received purchase order

WHEN the supplier receives a purchase order from the order processing centre, the supplier SHALL store it with status PENDING, SHALL immediately attempt to fulfil it from current stock, and SHALL send an invoice back to the order processing centre only if at least one line shipped; otherwise the order SHALL remain PENDING until stock is updated.

#### Scenario: Nothing in stock on receipt

- **GIVEN** zero stock for every item on incoming supplier order `1001`
- **WHEN** the supplier receives `1001`
- **THEN** `1001` is stored as PENDING and no invoice is sent

#### Scenario: Stock available on receipt

- **GIVEN** sufficient stock for every line of incoming supplier order `1002`
- **WHEN** the supplier receives `1002`
- **THEN** `1002` is COMPLETED and one invoice covering all its lines is sent to the order processing centre

### Requirement: Whole-line shipment from stock

WHEN fulfilling a supplier order, the supplier SHALL ship a line not yet fully shipped only if the on-hand stock of its item is at least the line's full ordered quantity, in which case stock MUST be reduced by the ordered quantity and the whole ordered quantity recorded as shipped. OTHERWISE nothing of that line SHALL be shipped or reserved and stock SHALL remain unchanged. An item with no stock record SHALL be treated as out of stock and MUST NOT fail the order. Lines SHALL be evaluated in order, so stock consumed by an earlier line is unavailable to a later line.

#### Scenario: Insufficient stock for a line

- **GIVEN** a line for 5 units of `EST-1` and 3 units of `EST-1` on hand
- **WHEN** fulfilment is attempted
- **THEN** no units of the line ship and stock of `EST-1` remains 3

#### Scenario: Sufficient stock for a line

- **GIVEN** a line for 5 units of `EST-1` and 8 units on hand
- **WHEN** fulfilment is attempted
- **THEN** the line's shipped quantity becomes 5 and stock of `EST-1` becomes 3

#### Scenario: Item with no stock record

- **GIVEN** a line for item `EST-99` for which no stock record exists
- **WHEN** fulfilment is attempted
- **THEN** the line is not shipped, no error is raised and the order stays PENDING

### Requirement: Partial shipment across lines and supplier order completion

The supplier SHALL fulfil each line independently, shipping the lines that can be filled even when other lines of the same order cannot, and SHALL skip lines already fully shipped when fulfilment is re-attempted. The supplier SHALL set the order to COMPLETED only when every line outstanding at the start of an attempt ships in that attempt; OTHERWISE the order SHALL remain PENDING and lines already shipped SHALL stay shipped.

#### Scenario: One of two lines can ship

- **GIVEN** a PENDING supplier order with a line for `EST-1` in stock and a line for `EST-6` out of stock
- **WHEN** fulfilment is attempted
- **THEN** the `EST-1` line is shipped, the `EST-6` line is not, and the order stays PENDING

#### Scenario: Re-attempt ships the remaining line

- **GIVEN** that order after `EST-6` stock is replenished
- **WHEN** fulfilment is re-attempted
- **THEN** only the `EST-6` line is evaluated and shipped, stock of `EST-1` is not reduced again, and the order becomes COMPLETED

### Requirement: Supplier invoice content

For each fulfilment attempt that ships at least one line, the supplier SHALL produce one invoice carrying the order identifier, the original order date, a shipping date equal to the current date, the fixed recipient text "Dear PetStore Customer" in place of a user id, and only the lines shipped in that attempt (category, product, item, line number, quantity, unit price). WHEN an attempt ships nothing THEN no invoice SHALL be produced.

#### Scenario: Invoice lists only this attempt's lines

- **GIVEN** a supplier order whose `EST-1` line shipped in an earlier attempt
- **WHEN** a later attempt ships its `EST-6` line
- **THEN** the invoice for that attempt lists only the `EST-6` line, the original order date and today's date as shipping date

### Requirement: Re-fulfilment of pending supplier orders on stock update

WHEN supplier stock quantities are updated, the supplier SHALL re-attempt fulfilment of every supplier order in PENDING status using the same per-line rules, SHALL produce one invoice per order that shipped anything and send each to the order processing centre, and SHALL skip an order whose invoice cannot be built without stopping the processing of the others.

#### Scenario: Stock update releases a waiting order

- **GIVEN** an approved customer order whose supplier order is PENDING for lack of stock of `EST-6`
- **WHEN** the supplier raises stock of `EST-6` sufficiently
- **THEN** the supplier order ships and becomes COMPLETED, an invoice is sent, and the customer order becomes COMPLETED without further administrator action

#### Scenario: One pending order fails invoice building

- **GIVEN** two PENDING supplier orders that can now ship, the first of which cannot have its invoice built
- **WHEN** stock is updated
- **THEN** the second order's invoice is still sent

### Requirement: Supplier message channels

The supplier SHALL receive supplier purchase orders as documents on a point-to-point channel from the order processing centre, each consumed by exactly one receiver, and SHALL publish each invoice as a document on the order processing centre's invoice channel, both after handling a newly received order and after re-fulfilling pending orders following a stock update.

#### Scenario: Invoice published after stock update

- **GIVEN** a PENDING supplier order that becomes fulfillable
- **WHEN** stock is updated
- **THEN** its invoice is published on the invoice channel and received by the order processing centre

### Requirement: Workflow step failures preserve their root cause

The system SHALL advance an order to its next workflow step by handing a configured step handler a single business document, a batch of business documents, or both. IF a handler cannot be prepared or its step fails THEN the system MUST report a workflow-step error that preserves the underlying cause.

#### Scenario: Handler fails

- **GIVEN** a step handler whose outbound send fails with a connection error
- **WHEN** the workflow step is performed
- **THEN** a workflow-step error is raised whose root cause is the connection error

### Requirement: Configured dependencies fail fast

The system SHALL resolve each external dependency it needs (message channels, the database, configured URL, boolean and text settings) by a configured name. IF a dependency cannot be resolved or is not of the expected type THEN the system MUST raise a single dependency-resolution error that keeps the underlying cause, at once, without retrying and without substituting a fallback.

#### Scenario: Missing configured channel

- **GIVEN** no invoice channel is configured under its expected name
- **WHEN** a component needs the invoice channel
- **THEN** a dependency-resolution error carrying the underlying cause is raised immediately and no fallback channel is used
