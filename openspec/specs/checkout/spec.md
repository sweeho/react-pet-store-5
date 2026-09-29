# checkout Specification

## Purpose

TBD - created by archiving change swhr-i-0009-checkout-and-order-placement. Update Purpose after archive.

## Requirements

### Requirement: Checkout hands the order off asynchronously

ID: SWHR-R-0145

WHEN a signed-in customer checks out a non-empty cart, the system SHALL collect billing and shipping information, accept the order, and hand it to order processing asynchronously. The customer's checkout response MUST NOT wait for order approval or fulfilment.

#### Scenario: Customer checks out a non-empty cart

ID: SWHR-R-0145.01

- **GIVEN** a signed-in customer whose cart holds two items
- **WHEN** the customer chooses Check Out
- **THEN** the order information form is presented, pre-filled from the customer's account

#### Scenario: Order submission returns before approval

ID: SWHR-R-0145.02

- **GIVEN** a customer on the order information form with valid billing and shipping details
- **WHEN** the customer submits the form
- **THEN** the order is handed to order processing and the confirmation is shown without waiting for the order to be approved

### Requirement: Order information screen

ID: SWHR-R-0146

The order information screen SHALL be available only to a signed-in customer. It SHALL display a Billing Information section and a Shipping Information section. Each section MUST carry these inputs: first name, last name, street address line 1, street address line 2, city, state/province, postal code, country, telephone and e-mail. Every input in both sections SHALL be pre-filled from the signed-in customer's stored contact information. State/province and country SHALL be choices from a fixed list, and the screen SHALL offer one Submit control that places the order using the values shown.

#### Scenario: Form is displayed pre-filled

ID: SWHR-R-0146.01

- **GIVEN** a signed-in customer whose stored contact is "Jane Doe, 1 Main St, Palo Alto, California 94301, United States, 555-0100, jane@example.com"
- **WHEN** the order information screen is displayed
- **THEN** the Billing Information and Shipping Information sections each show those values in the first name, last name, street address, city, state/province, postal code, country, telephone and e-mail inputs, and a Submit control is shown

#### Scenario: Customer edits shipping before submitting

ID: SWHR-R-0146.02

- **GIVEN** the order information screen pre-filled from the customer's stored contact
- **WHEN** the customer changes the shipping city to "San Jose" and presses Submit
- **THEN** the order is placed with the billing city unchanged and the shipping city "San Jose"

#### Scenario: Anonymous visitor requests the screen

ID: SWHR-R-0146.03

- **GIVEN** a visitor who is not signed in
- **WHEN** the visitor requests the order information screen
- **THEN** the visitor is sent to sign in before the screen is shown

### Requirement: Required billing and shipping contact fields

ID: SWHR-R-0147

The system SHALL require these fields for both the billing contact and the shipping contact, each non-blank after trimming whitespace: last name, first name, street address line 1, city, state/province, postal code and telephone number. Street address line 2 and e-mail SHALL be optional. A blank street address line 2 MUST be stored as absent.

#### Scenario: A required shipping field is blank

ID: SWHR-R-0147.01

- **GIVEN** the order information form with the shipping telephone number left blank
- **WHEN** the form is submitted
- **THEN** no order is placed and the telephone number is reported as missing

#### Scenario: Optional fields are blank

ID: SWHR-R-0147.02

- **GIVEN** the order information form with every required field filled and street address line 2 and e-mail blank in the shipping section
- **WHEN** the form is submitted
- **THEN** the submission passes contact validation

### Requirement: Empty-cart order rejection

ID: SWHR-R-0148

The system MUST NOT place an order when the customer's cart is empty. It SHALL instead show an Order Error stating that the cart is empty and the order could not be placed, and noting that if the customer re-submitted an order already placed, that order was placed and a confirmation will follow.

#### Scenario: Order submitted with an empty cart

ID: SWHR-R-0148.01

- **GIVEN** a signed-in customer whose cart is empty
- **WHEN** the customer submits the order information form
- **THEN** no order is handed to order processing and the Order Error explaining the empty cart and the possible re-submission is shown

#### Scenario: Order form re-submitted after a successful order

ID: SWHR-R-0148.02

- **GIVEN** a customer whose order was just placed and whose cart was therefore emptied
- **WHEN** the same order information form is submitted again
- **THEN** no second order is placed and the empty-cart Order Error is shown

### Requirement: Purchase order contents

ID: SWHR-R-0149

WHEN an order is placed, the system SHALL create a purchase order carrying:

- a newly generated unique order id
- the signed-in customer's user id
- the billing e-mail as the order's contact e-mail
- the current date and time as the order date
- the billing contact
- the shipping contact
- a credit card
- the customer's current locale

#### Scenario: Purchase order is populated at submission

ID: SWHR-R-0149.01

- **GIVEN** signed-in user "j2ee" with locale en_US, billing e-mail "bill@example.com" and a non-empty cart
- **WHEN** the order is placed
- **THEN** the purchase order carries a new order id, user id "j2ee", contact e-mail "bill@example.com", the current timestamp as order date, both contacts, a credit card and locale en_US

### Requirement: Order lines and total

ID: SWHR-R-0150

The system SHALL add one order line per cart item, in cart order. Each line SHALL carry the item's category, product, item, quantity and unit cost, plus a line number that starts at 0 and increases by 1. The order total SHALL be the sum over lines of unit cost multiplied by quantity. No tax, shipping charge or discount SHALL be applied.

#### Scenario: Two-line cart

ID: SWHR-R-0150.01

- **GIVEN** a cart with item EST-1 at 16.50 quantity 2, followed by item EST-6 at 18.50 quantity 1
- **WHEN** the order is placed
- **THEN** line 0 is EST-1 quantity 2 unit cost 16.50, line 1 is EST-6 quantity 1 unit cost 18.50, and the order total is 51.50

### Requirement: Credit card attached to every order

ID: SWHR-R-0151

The system SHALL attach a credit card, consisting of card number, card type and expiry date, to every placed order.

#### Scenario: Order carries a card

ID: SWHR-R-0151.01

- **GIVEN** a customer submitting a valid order
- **WHEN** the order is placed
- **THEN** the purchase order handed to order processing includes a card number, card type and expiry date

### Requirement: Order hand-off to order processing

ID: SWHR-R-0152

WHEN an order is placed, the system SHALL publish the purchase order, serialized as an XML document, as a single message on the order-processing queue. The system MUST NOT wait for order processing to act on it. The system SHALL empty the customer's cart only after the hand-off.

#### Scenario: Successful hand-off

ID: SWHR-R-0152.01

- **GIVEN** a customer submitting a valid order with a non-empty cart
- **WHEN** the order is placed
- **THEN** exactly one message containing the purchase order XML is published on the order-processing queue, and afterwards the cart is empty

#### Scenario: Message send fails

ID: SWHR-R-0152.02

- **GIVEN** the order-processing queue rejects the send
- **WHEN** a customer submits a valid order
- **THEN** an error is raised, the order confirmation is not shown and the cart is not emptied

### Requirement: Order message is enqueued within the caller's unit of work

ID: SWHR-R-0153

The system SHALL enqueue an outbound order-processing message as part of the caller's unit of work. The message MUST become visible to its consumer only if that unit of work commits.

#### Scenario: Caller rolls back after enqueueing

ID: SWHR-R-0153.01

- **GIVEN** an order message handed to the sender inside a unit of work
- **WHEN** that unit of work rolls back
- **THEN** the message is not delivered to order processing

### Requirement: Enqueue failure is raised, never silent

ID: SWHR-R-0154

GIVEN the messaging destination cannot be resolved, or the connection, session or send fails, the system SHALL raise an error to the caller that aborts the caller's unit of work. The system MUST release the messaging connection in all cases.

#### Scenario: Queue cannot be reached

ID: SWHR-R-0154.01

- **GIVEN** the messaging connection cannot be opened
- **WHEN** an order message is enqueued
- **THEN** an error is raised to the caller, the caller's unit of work is aborted, and no connection is left open

### Requirement: Order complete screen

ID: SWHR-R-0155

WHEN an order has been placed, the system SHALL display an order complete screen showing:

- the heading "Your Order is Complete"
- the order id of the order just placed
- a statement that a confirmation e-mail will be sent to the order's billing e-mail address
- a thank-you message

#### Scenario: Confirmation after a successful order

ID: SWHR-R-0155.01

- **GIVEN** a customer whose order was placed with order id "10017" and billing e-mail "jane@example.com"
- **WHEN** the order complete screen is displayed
- **THEN** it shows "Your Order is Complete", the order id "10017" and a statement that a confirmation e-mail will be sent to "jane@example.com"

### Requirement: Order identifier format

ID: SWHR-R-0156

The system SHALL generate each order id from the order counter with the fixed prefix "1001". The order id SHALL be the prefix immediately followed by the counter's new value in decimal, with no separator and no zero padding.

#### Scenario: First and subsequent orders

ID: SWHR-R-0156.01

- **GIVEN** no order has ever been placed
- **WHEN** three orders are placed in succession
- **THEN** they receive order ids "10011", "10012" and "10013"

#### Scenario: Counter at 7

ID: SWHR-R-0156.02

- **GIVEN** the counter for prefix "1001" holds 7
- **WHEN** an identifier is requested for prefix "1001"
- **THEN** "10018" is returned and the counter holds 8

### Requirement: Per-prefix identifier counters

ID: SWHR-R-0157

The system SHALL keep one independent counter per identifier prefix. When a prefix is first used, the system SHALL create its counter with value 0 and then advance it, so the first identifier issued for a prefix ends in "1". If a counter for a new prefix cannot be created, the system MUST fail the identifier request with an error naming the prefix.

#### Scenario: New prefix

ID: SWHR-R-0157.01

- **GIVEN** no counter exists for prefix "2002"
- **WHEN** an identifier is requested for prefix "2002"
- **THEN** a counter for "2002" is created and "20021" is returned

#### Scenario: Counter creation fails

ID: SWHR-R-0157.02

- **GIVEN** no counter exists for prefix "2002" and the counter cannot be created
- **WHEN** an identifier is requested for prefix "2002"
- **THEN** the request fails with an error naming "2002"

### Requirement: Atomic identifier issuance

ID: SWHR-R-0158

The system SHALL perform the counter lookup-or-creation, increment and store for one identifier request as a single atomic unit of work, so that no two requests for the same prefix receive the same identifier. That unit of work SHALL join the caller's transaction when one is active.

#### Scenario: Concurrent requests for the same prefix

ID: SWHR-R-0158.01

- **GIVEN** the counter for prefix "1001" holds 20
- **WHEN** two identifier requests for "1001" run concurrently
- **THEN** one receives "100121" and the other "100122", and the counter holds 22

#### Scenario: Caller rolls back

ID: SWHR-R-0158.02

- **GIVEN** an identifier request made inside a caller's transaction that later rolls back
- **WHEN** the rollback completes
- **THEN** the counter increment is also rolled back

### Requirement: Identifier counter record

ID: SWHR-R-0159

The system SHALL persist each identifier counter with a name and a mandatory integer value. The name is the prefix, is the record's unique key and is at most 255 characters long. At most one counter SHALL exist per name.

#### Scenario: Duplicate counter name

ID: SWHR-R-0159.01

- **GIVEN** a counter named "1001" exists
- **WHEN** a second counter named "1001" is inserted
- **THEN** the insert is rejected by the uniqueness constraint

### Requirement: Stored purchase order total

ID: SWHR-R-0160

The system SHALL store the purchase order total exactly as supplied on the incoming purchase order. The system MUST NOT recompute or cross-check it against the order lines when persisting it.

#### Scenario: Supplied total is persisted verbatim

ID: SWHR-R-0160.01

- **GIVEN** an incoming purchase order whose total is 51.50
- **WHEN** the purchase order is persisted
- **THEN** the stored order value is 51.50, read from the supplied total and not re-derived from the lines

### Requirement: Stored purchase order contact and payment

ID: SWHR-R-0161

The system SHALL store with each purchase order:

- a contact with given name, family name, telephone and e-mail
- exactly one postal address for that contact, with street line 1, street line 2, city, state, postal code and country
- a payment card with card number, card type and expiry date

The stored contact SHALL be taken from the order's shipping information. It SHALL be a new snapshot, with its own address record, and MUST NOT be a reference to the customer's profile contact.

#### Scenario: Order contact is a snapshot

ID: SWHR-R-0161.01

- **GIVEN** a purchase order whose shipping contact matches the customer's profile contact
- **WHEN** the purchase order is persisted and the customer later changes their profile address
- **THEN** the stored order still holds the address supplied with the order

### Requirement: Order placement is one transaction

ID: SWHR-R-0162

The system SHALL apply an order submission to the customer's server-side state within a single transaction. That covers identifier issuance, purchase order construction, enqueueing the order message and emptying the cart. The system SHALL select the next screen from the outcome: the order complete screen on success, or the error screen mapped to the failure.

#### Scenario: Failure inside order placement

ID: SWHR-R-0162.01

- **GIVEN** an order submission whose message enqueue fails
- **WHEN** the submission is processed
- **THEN** the transaction is rolled back, including the order id increment and the enqueued message, and the order complete screen is not shown

### Requirement: Error screen selection by failure kind

ID: SWHR-R-0163

The system SHALL route a failed request to the error screen configured for the failure's kind. A configured kind SHALL also cover all of its more specific kinds. The system SHALL show:

- a dedicated screen for an order placed with an empty cart
- a dedicated screen for a duplicate account
- a general error screen for general failures

A failure whose kind matches no configured entry SHALL fail the request with a generic server error naming the failure kind.

#### Scenario: Mapped failure

ID: SWHR-R-0163.01

- **GIVEN** an order is submitted with an empty cart
- **WHEN** the empty-cart failure is raised
- **THEN** the empty-cart Order Error screen is shown

#### Scenario: Unmapped failure

ID: SWHR-R-0163.02

- **GIVEN** a failure whose kind has no configured error screen
- **WHEN** it is raised while processing a request
- **THEN** the request fails with a generic server error naming the failure kind

### Requirement: Consistent reads while rendering a screen

ID: SWHR-R-0164

The system SHOULD render each screen within a single read transaction so that the data it shows is read consistently. If a transaction cannot be started, the page SHALL still be rendered. A failure to commit MUST NOT prevent the page from being delivered.

#### Scenario: Transaction unavailable

ID: SWHR-R-0164.01

- **GIVEN** no transaction can be started for a page render
- **WHEN** the order complete screen is requested
- **THEN** the page is still rendered and delivered
