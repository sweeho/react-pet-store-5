## ADDED Requirements

### Requirement: Order approval decision notification
ID: SWHR-R-0233

WHEN an order moves from pending to an approval decision (approved or denied) and approval notifications are enabled, the system SHALL send the customer exactly one email to the email address held on the order, with the subject `Java Pet Store Order Status: <orderId>`, stating whether the order was approved or denied. WHEN several orders receive a decision in the same batch, the system SHALL send one such email per affected order.

#### Scenario: Order approved
ID: SWHR-R-0233.01

- **GIVEN** approval notifications are enabled and order 1001 is pending with email address `ann@example.com`
- **WHEN** order 1001 is approved
- **THEN** one email with subject `Java Pet Store Order Status: 1001` is sent to `ann@example.com` stating the order was approved

#### Scenario: Batch of decisions
ID: SWHR-R-0233.02

- **GIVEN** approval notifications are enabled and orders 1001 (approved) and 1002 (denied) are decided in one batch
- **WHEN** the batch is processed
- **THEN** exactly two emails are sent, one per order, each addressed to that order's email address and stating that order's decision

### Requirement: Shipment notification
ID: SWHR-R-0234

WHEN a supplier invoice (a shipment of part or all of an order) is received for an order and shipment notifications are enabled, the system SHALL send the customer one email to the order's email address with the subject `Java Pet Store Order Shipped: <orderId>`, describing the lines contained in that shipment. The shipment email SHALL be sent whether or not the shipment completes the order.

#### Scenario: Partial shipment
ID: SWHR-R-0234.01

- **GIVEN** shipment notifications are enabled and order 1001 has three lines
- **WHEN** an invoice covering two of the lines is received
- **THEN** one email with subject `Java Pet Store Order Shipped: 1001` is sent to the order's email address listing those two lines only

#### Scenario: Final shipment completes the order
ID: SWHR-R-0234.02

- **GIVEN** shipment and completed-order notifications are both enabled
- **WHEN** the invoice that completes order 1001 is received
- **THEN** the customer receives the shipment email for that invoice AND, separately, the order-completed email

### Requirement: Order completed notification
ID: SWHR-R-0235

WHEN an order reaches the completed status and completed-order notifications are enabled, the system SHALL send the customer one email to the order's email address with the subject `Java Pet Store Order COMPLETED: <orderId>`, stating that the entire order has shipped and listing every line of the order with its category, product number, quantity and unit price.

#### Scenario: Order completes
ID: SWHR-R-0235.01

- **GIVEN** completed-order notifications are enabled and order 1001 has three lines
- **WHEN** order 1001 becomes completed
- **THEN** one email with subject `Java Pet Store Order COMPLETED: 1001` is sent to the order's email address listing all three lines

### Requirement: Notification sequence over an order's life
ID: SWHR-R-0236

WHEN all notification kinds are enabled, the system SHALL send a customer one email when the order is approved, one email per shipment as parts of the order are fulfilled, and one final email when the order is completely fulfilled, each addressed to the email address on the order.

#### Scenario: Order fulfilled in two shipments
ID: SWHR-R-0236.01

- **GIVEN** all notification kinds are enabled
- **WHEN** an order is approved and then fulfilled in two shipments, the second of which completes it
- **THEN** the customer receives four emails in total: one approval, two shipment and one completion email

### Requirement: Independently switchable notification kinds
ID: SWHR-R-0237

The system SHALL provide three independent deployment-time switches, one each for approval-decision, shipment and order-completed emails. WHEN a kind is switched off and its trigger occurs, the system MUST NOT send an email of that kind, SHALL consume the trigger, and order processing MUST continue unaffected. Changing a switch MUST NOT require a code change.

#### Scenario: Shipment emails switched off
ID: SWHR-R-0237.01

- **GIVEN** shipment notifications are disabled and approval and completed-order notifications are enabled
- **WHEN** an invoice is received for an order
- **THEN** no shipment email is sent, the invoice is still applied to the order, and the other two kinds continue to be sent when their triggers occur

### Requirement: Missing or invalid notification switch fails fast
ID: SWHR-R-0238

WHEN a notification switch is missing or is not a boolean, the component that sends that kind of email SHALL fail to start with an error and MUST NOT assume a default of on or off.

#### Scenario: Switch not configured
ID: SWHR-R-0238.01

- **GIVEN** the completed-order notification switch is absent from the configuration
- **WHEN** the completed-order notification sender starts
- **THEN** start-up fails with a configuration error naming the missing switch and no completed-order email is sent

### Requirement: Asynchronous email delivery
ID: SWHR-R-0239

The system SHALL deliver customer emails asynchronously: order processing SHALL hand a mail request carrying a recipient, a subject and an HTML body to a separate mail-sending service, and MUST NOT send mail inline during order processing. The mail-sending service SHALL send exactly one email per request it accepts.

#### Scenario: Mail server slow
ID: SWHR-R-0239.01

- **GIVEN** the outbound mail server takes 30 seconds to accept a message
- **WHEN** an order is approved
- **THEN** the approval is recorded without waiting for the mail server, and the approval email is sent later by the mail-sending service

### Requirement: Mail request structure and validation
ID: SWHR-R-0240

A mail request SHALL consist of exactly three required text fields in this order: recipient address, subject and body content. The mail-sending service SHALL validate every request against this structure before sending. WHEN a request is malformed, has missing or out-of-order fields, or is not a text payload, the system MUST NOT send any email for it and SHALL fail processing of that request with an error so it is not acknowledged as delivered.

#### Scenario: Request missing its subject
ID: SWHR-R-0240.01

- **GIVEN** a mail request carrying a recipient address and body but no subject
- **WHEN** the mail-sending service receives it
- **THEN** no email is sent and processing of the request fails with a validation error

#### Scenario: Well-formed request
ID: SWHR-R-0240.02

- **GIVEN** a mail request with recipient `ann@example.com`, subject `Java Pet Store Order Status: 1001` and an HTML body
- **WHEN** the mail-sending service receives it
- **THEN** exactly one email is sent to `ann@example.com` with that subject and body

### Requirement: Outgoing email format
ID: SWHR-R-0241

Every customer notification email SHALL be addressed with the request's recipient as the To recipient, SHALL carry the request's subject, SHALL carry the request's content verbatim as an HTML body encoded as UTF-8, and SHALL be stamped with the time of sending.

#### Scenario: Email headers and body
ID: SWHR-R-0241.01

- **GIVEN** a valid mail request with recipient `ann@example.com`, subject `S` and body `<b>hello</b>`
- **WHEN** the email is sent at 2026-09-26T10:00:00Z
- **THEN** the sent email has To `ann@example.com`, subject `S`, an HTML body `<b>hello</b>` encoded as UTF-8, and a sent date of 2026-09-26T10:00:00Z

### Requirement: Configured sender and mail server
ID: SWHR-R-0242

The system SHALL send all customer notification emails through a configurable outbound mail server and from a single configurable sender (From) address; the sender MUST NOT be taken from the mail request. The shipped default sender address SHALL be `customerservice@javapetstoredemo.com`.

#### Scenario: Default sender
ID: SWHR-R-0242.01

- **GIVEN** no sender override is configured
- **WHEN** any customer notification email is sent
- **THEN** its From address is `customerservice@javapetstoredemo.com` and it is submitted to the configured mail server

#### Scenario: Sender changed by configuration
ID: SWHR-R-0242.02

- **GIVEN** the sender is configured as `orders@shop.example`
- **WHEN** any customer notification email is sent
- **THEN** its From address is `orders@shop.example`

### Requirement: Send failure handling
ID: SWHR-R-0243

WHEN a valid mail request cannot be sent (mail server unavailable, unparseable recipient address, or any other transport failure), the system SHALL log the failure, SHALL treat the request as consumed without retrying, and MUST NOT surface an error to the customer or to order processing.

#### Scenario: Mail server down
ID: SWHR-R-0243.01

- **GIVEN** the outbound mail server is unreachable
- **WHEN** a valid approval email request is processed
- **THEN** the failure is logged, the request is not retried, and the order's approval remains recorded

### Requirement: Notifications rendered in the order's locale
ID: SWHR-R-0244

The system SHALL render the subject line identifier and the body of each approval, shipment and completed-order email in the locale recorded on the order, supporting at least en_US, ja_JP and zh_CN.

#### Scenario: Japanese-locale order
ID: SWHR-R-0244.01

- **GIVEN** order 1003 was placed with locale ja_JP and shipment notifications are enabled
- **WHEN** a shipment for order 1003 is received
- **THEN** the shipment email body is rendered with the ja_JP wording

### Requirement: Approval decision email content
ID: SWHR-R-0245

The approval decision email SHALL thank the customer for placing an order, show the order identifier, and state the decision. WHEN the order was approved, the email SHALL state that the order has been approved and will now be fulfilled (en_US wording: "approved! We will now fulfill your order."). WHEN the order was denied, the email SHALL state that the order was denied and could not be placed (en_US wording: "denied unfortunately. Sorry we could not place your order."). The email SHALL close by thanking the customer for shopping. The ja_JP and zh_CN emails SHALL carry translated equivalents.

#### Scenario: Approved order email displayed
ID: SWHR-R-0245.01

- **GIVEN** order 1001 with locale en_US has been approved
- **WHEN** the customer opens the approval decision email
- **THEN** it thanks the customer for the order, shows order id 1001, and states "approved! We will now fulfill your order."

#### Scenario: Denied order email displayed
ID: SWHR-R-0245.02

- **GIVEN** order 1002 with locale en_US has been denied
- **WHEN** the customer opens the approval decision email
- **THEN** it shows order id 1002 and states "denied unfortunately. Sorry we could not place your order."

### Requirement: Shipment email content
ID: SWHR-R-0246

The shipment email SHALL thank the customer, show the order identifier, state that this part of the order has shipped, and list the shipment contents as a table with the columns Category, Product #, Quantity and Unit Price, one row per shipped line, with the unit price formatted as currency for the order's locale.

#### Scenario: Shipment of two lines displayed
ID: SWHR-R-0246.01

- **GIVEN** a shipment for order 1001 (locale en_US) containing 2 of product `FI-SW-01` in category `FISH` at 16.5 and 1 of product `K9-BD-01` in category `DOGS` at 18.5
- **WHEN** the customer opens the shipment email
- **THEN** it shows order id 1001, states that this part of the order has shipped, and shows a table with headers Category, Product #, Quantity, Unit Price and two rows `FISH | FI-SW-01 | 2 | $16.50` and `DOGS | K9-BD-01 | 1 | $18.50`
