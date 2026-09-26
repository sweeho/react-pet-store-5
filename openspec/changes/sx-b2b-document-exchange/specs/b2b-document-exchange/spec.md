## ADDED Requirements

### Requirement: Purchase order document structure

The system SHALL exchange a customer purchase order as an XML document whose root element is `PurchaseOrder`, carrying a `locale` attribute that defaults to `en_US` and containing, in this order, `OrderId`, `UserId`, `EmailId`, `OrderDate`, `ShippingInfo` (one contact), `BillingInfo` (one contact), `TotalPrice`, `CreditCard` and one or more `LineItem` elements. The document type SHALL be identified by the public identifier `-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD PurchaseOrder 1.1//EN`.

#### Scenario: Purchase order written with two line items

- **GIVEN** an order with a shipping contact, a billing contact, a credit card and two line items
- **WHEN** the order is written as a purchase order document
- **THEN** the root `PurchaseOrder` element contains `OrderId`, `UserId`, `EmailId`, `OrderDate`, `ShippingInfo`, `BillingInfo`, `TotalPrice`, `CreditCard` and two `LineItem` elements, in that order

#### Scenario: Purchase order without a locale attribute

- **GIVEN** an inbound purchase order document whose root element has no `locale` attribute
- **WHEN** the document is read
- **THEN** the order locale is `en_US`

#### Scenario: Purchase order with no line items

- **GIVEN** a purchase order document containing no `LineItem` element
- **WHEN** it is validated against the purchase order document type
- **THEN** the document is reported as invalid

### Requirement: Purchase order document root check

The system MUST reject an inbound purchase order document whose root element is not `PurchaseOrder`, with the error `PurchaseOrder element expected.`, and SHALL validate purchase order documents against their document type by default unless validation is switched off by configuration.

#### Scenario: Wrong root element

- **GIVEN** an inbound document whose root element is `SupplierOrder`
- **WHEN** it is read as a purchase order
- **THEN** reading fails with `PurchaseOrder element expected.` and no order is produced

### Requirement: Purchase order date handling

The system SHALL write `OrderDate` in a purchase order document as a calendar date in `yyyy-MM-dd` form with no time of day. When an inbound purchase order's `OrderDate` is missing or cannot be parsed as `yyyy-MM-dd`, the system SHALL substitute the current date and continue reading rather than rejecting the document.

#### Scenario: Order date written

- **GIVEN** an order placed at 2002-03-15 14:32
- **WHEN** it is written as a purchase order document
- **THEN** `OrderDate` contains `2002-03-15`

#### Scenario: Unparseable order date

- **GIVEN** an inbound purchase order whose `OrderDate` is `15/03/2002`
- **WHEN** the document is read
- **THEN** the order date is set to the current date and reading continues

### Requirement: Contact information element

The system SHALL represent contact information in exchanged documents as a `ContactInfo` element containing, in this exact order, `FamilyName`, `GivenName`, `Address`, `Email` and `Phone`, every one present as an element. On read the system MUST reject a node that is not a `ContactInfo` element with `ContactInfo element expected.`, MUST reject empty `FamilyName`, `GivenName` or `Phone` content, and SHALL accept an empty `Email`.

#### Scenario: Empty email accepted

- **GIVEN** a `ContactInfo` element whose `Email` element is present but empty
- **WHEN** it is read
- **THEN** the contact is accepted with an empty email

#### Scenario: Empty phone rejected

- **GIVEN** a `ContactInfo` element whose `Phone` element is empty
- **WHEN** it is read
- **THEN** reading fails with `Phone element: content expected.`

#### Scenario: Elements out of order

- **GIVEN** a `ContactInfo` element whose `GivenName` precedes `FamilyName`
- **WHEN** it is read
- **THEN** reading fails with an error naming the expected element

### Requirement: Address element output

The system SHALL write an address as an `Address` element containing, in order, `StreetName` (first street line), an optional second `StreetName`, `City`, `State`, `ZipCode` and `Country`. The second `StreetName` MUST be emitted only when the second street line is present and non-empty. Every other child SHALL always be emitted, as an empty element when its value is absent.

#### Scenario: No second street line

- **GIVEN** an address whose second street line is empty
- **WHEN** it is written
- **THEN** exactly one `StreetName` element is produced, followed by `City`, `State`, `ZipCode` and `Country`

#### Scenario: Missing state

- **GIVEN** an address with no state value
- **WHEN** it is written
- **THEN** an empty `State` element is emitted in its position

### Requirement: Address element input

The system MUST reject an inbound `Address` element unless it contains, in order, a non-empty `StreetName`, an optional second non-empty `StreetName`, and non-empty `City`, `State`, `ZipCode` and `Country` elements; the error SHALL name the expected element. A node that is not an `Address` element MUST be rejected with `Address element expected.`

#### Scenario: Empty city

- **GIVEN** an `Address` element whose `City` element is empty
- **WHEN** it is read
- **THEN** reading fails with `City element: content expected.`

#### Scenario: Missing country

- **GIVEN** an `Address` element with no `Country` element
- **WHEN** it is read
- **THEN** reading fails with an error naming `Country` as the expected element

#### Scenario: Present but empty second street line

- **GIVEN** an `Address` element with a second `StreetName` element that is empty
- **WHEN** it is read
- **THEN** reading fails

### Requirement: Credit card element

The system SHALL represent a payment card in exchanged order documents as a `CreditCard` element containing `CardNumber`, `CardType` and `ExpiryDate`, in that order, each carrying text content. On read the system MUST reject a node that is not a `CreditCard` element with `CreditCard element expected.`

#### Scenario: Credit card round trip

- **GIVEN** a card with number, type and expiry date
- **WHEN** it is written and read back
- **THEN** the three values are unchanged and appear in the order `CardNumber`, `CardType`, `ExpiryDate`

#### Scenario: Wrong element offered as a card

- **GIVEN** a `ContactInfo` node offered as a credit card
- **WHEN** it is read
- **THEN** reading fails with `CreditCard element expected.`

### Requirement: Order line item element

The system SHALL represent an order line item in exchanged order documents as a `LineItem` element containing, each exactly once and in this order, `CategoryId`, `ProductId`, `ItemId`, `LineNum`, `Quantity` and `UnitPrice`. On read the system MUST reject a node that is not a `LineItem` element with `LineItem element expected.`, MUST reject a missing or out-of-order child, and MUST reject a `Quantity` that is not an integer or a `UnitPrice` that is not a decimal number.

#### Scenario: Non-numeric quantity

- **GIVEN** a `LineItem` element whose `Quantity` is `two`
- **WHEN** it is read
- **THEN** reading fails and no line item is produced

#### Scenario: Missing unit price

- **GIVEN** a `LineItem` element with no `UnitPrice` child
- **WHEN** it is read
- **THEN** reading fails with an error naming `UnitPrice` as the expected element

### Requirement: Line item export excludes shipped quantity

The system SHALL NOT carry the quantity already shipped when a stored line item is exported for document exchange; only category, product, item, line number, ordered quantity and unit price SHALL be carried.

#### Scenario: Partly shipped line exported

- **GIVEN** a stored line item with ordered quantity 5 and shipped quantity 3
- **WHEN** it is exported into an exchanged document
- **THEN** the element carries quantity 5 and no shipped-quantity value

### Requirement: Internal supplier order document

The system SHALL exchange an internal supplier order as an XML document whose root element is `SupplierOrder` and contains, in order, `OrderId`, `OrderDate`, `ShippingInfo` wrapping one `ContactInfo`, and one or more `LineItem` elements, identified by the public identifier `-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD SupplierOrder 1.1//EN`. The system SHALL validate it by default and MUST reject a document whose root element is not `SupplierOrder` with `SupplierOrder element expected.`

#### Scenario: Wrong root element

- **GIVEN** an inbound document whose root element is `PurchaseOrder`
- **WHEN** it is read as a supplier order
- **THEN** reading fails with `SupplierOrder element expected.`

#### Scenario: Supplier order written

- **GIVEN** a supplier order with a shipping contact and three line items
- **WHEN** it is written
- **THEN** the root contains `OrderId`, `OrderDate`, `ShippingInfo` and three `LineItem` elements, in that order

### Requirement: Internal supplier order date handling

The system SHALL write and read the supplier order `OrderDate` as a calendar date in `yyyy-MM-dd` form. When an inbound supplier order's `OrderDate` is missing or cannot be parsed, the system SHALL substitute the current date and continue rather than rejecting the document.

#### Scenario: Unparseable supplier order date

- **GIVEN** an inbound supplier order whose `OrderDate` is `not-a-date`
- **WHEN** it is read
- **THEN** the order date is set to the current date and reading continues

### Requirement: Partner supplier order document

The system SHALL send each supplier purchase order in the trading-partner supplier order format: root `SupplierOrder` in namespace `http://blueprints.j2ee.sun.com/TPASupplierOrder`, containing in order `OrderId`, `OrderDate`, `ShippingAddress` and `LineItems` holding one or more line items. `ShippingAddress` MUST contain, all present and in order, `FirstName`, `LastName`, `Street`, `City`, `State`, `Country`, `ZipCode`, `Email` and `Phone`.

#### Scenario: Partner order built for an approved order

- **GIVEN** an approved order with ship-to contact and two line items
- **WHEN** the supplier purchase order is built
- **THEN** it carries the order id, order date, the nine shipping-address fields in order, and two line items each with category id, product id, item id, line number, quantity and unit price

#### Scenario: Second street line not transmitted

- **GIVEN** an approved order whose ship-to address has a second street line
- **WHEN** the supplier purchase order is built
- **THEN** `Street` carries only the first street line

### Requirement: Partner supplier order intake

The supplier SHALL accept a supplier order in the trading-partner format (identified by the `TPA-SupplierOrder 1.0` public identifier or the `TPASupplierOrder` namespace) and SHALL convert it to the internal supplier order, mapping order id, order date, shipping contact (names, street, city, state, zip, country, email, phone) and each line item's category id, product id, item id, line number, quantity and unit price. A document already in the internal `SupplierOrder 1.1` format SHALL be accepted without conversion.

#### Scenario: Partner-format order received

- **GIVEN** a partner-format supplier order with two line items
- **WHEN** the supplier receives it
- **THEN** an internal supplier order with the same order id, date, shipping contact and two line items is produced

#### Scenario: Internal-format order received

- **GIVEN** a supplier order already in the internal `SupplierOrder 1.1` format
- **WHEN** the supplier receives it
- **THEN** it is processed unchanged

### Requirement: Partner invoice document

The supplier SHALL return each shipment as an invoice document with root `Invoice` in namespace `http://blueprints.j2ee.sun.com/TPAInvoice`, containing in order `OrderId`, `UserId`, `OrderDate`, `ShippingDate` and `LineItems` holding one or more shipped line items. When the invoice declares a document type (DTD form) its `locale` SHALL default to `en_US`.

#### Scenario: Invoice for a shipment

- **GIVEN** a shipment of two items for order 1001 placed by user `j2ee`
- **WHEN** the invoice is built
- **THEN** it contains `OrderId` 1001, `UserId` `j2ee`, `OrderDate`, `ShippingDate` and two line items, in that order

### Requirement: Partner invoice intake

The order centre MUST accept a supplier invoice only when its root element is `Invoice` in namespace `http://blueprints.j2ee.sun.com/TPAInvoice`, and SHALL read from it the `OrderId` and, for each line item in namespace `http://blueprints.j2ee.sun.com/TPALineItem`, its `itemId` and integer `quantity`. Any other root element MUST be rejected with `Invoice element expected.`

#### Scenario: Valid invoice received

- **GIVEN** an invoice for order 1001 with line items EST-1 quantity 2 and EST-2 quantity 1
- **WHEN** the order centre receives it
- **THEN** it reads order 1001 and the shipped quantities EST-1 → 2 and EST-2 → 1

#### Scenario: Wrong document on the invoice channel

- **GIVEN** a document whose root element is `SupplierOrder`
- **WHEN** it is received as an invoice
- **THEN** it is rejected with `Invoice element expected.`

### Requirement: Partner line item values

Every line item in a partner supplier order or invoice MUST carry `categoryId`, `productId`, `itemId`, `lineNo`, `quantity` and `unitPrice`. `lineNo` SHALL be a non-negative integer, `quantity` SHALL be an integer of at least 1, and `unitPrice` SHALL be a decimal greater than or equal to 0. The system SHALL write quantity as a whole number and unit price as a decimal number without rounding.

#### Scenario: Zero unit price

- **GIVEN** a partner line item with unit price 0.0
- **WHEN** the document is validated against the partner schema
- **THEN** the line item is accepted

#### Scenario: Zero quantity

- **GIVEN** a partner line item with quantity 0
- **WHEN** the document is validated against the partner schema
- **THEN** the document is reported as invalid

### Requirement: Unique item per partner document

The system SHALL NOT allow the same item id on more than one line item within a single partner supplier order or a single partner invoice.

#### Scenario: Duplicate item id

- **GIVEN** a partner supplier order with two line items both carrying item id EST-1
- **WHEN** it is validated against the partner schema
- **THEN** validation reports an error

### Requirement: Partner document dates

The system SHALL write order dates and shipping dates in partner supplier orders and invoices as calendar dates in `yyyy-MM-dd` form, without a time of day.

#### Scenario: Shipping date written

- **GIVEN** a shipment made at 2002-03-16 09:05
- **WHEN** the invoice is built
- **THEN** `ShippingDate` contains `2002-03-16`

### Requirement: Required document values

The system MUST refuse to build an exchanged partner document when any element value is absent, failing with an error that names the element. An empty string SHALL be accepted as a value.

#### Scenario: Missing user id

- **GIVEN** an invoice being built with no user id
- **WHEN** the document is built
- **THEN** building fails with an error naming `UserId`

#### Scenario: Empty string value

- **GIVEN** a supplier order being built with an empty phone number
- **WHEN** the document is built
- **THEN** an empty `Phone` element is written

### Requirement: Document encoding

The system SHALL encode every XML document it produces in UTF-8 and SHALL emit it indented.

#### Scenario: Non-ASCII name

- **GIVEN** a contact whose family name is `Müller`
- **WHEN** the purchase order document is written
- **THEN** the document declares UTF-8 encoding and the name is encoded in UTF-8

### Requirement: Configurable document validation

The system SHALL allow validation of inbound purchase order, order approval, invoice and supplier order documents to be switched on or off by configuration, independently per document type. The system SHALL allow partner supplier order and invoice documents to be produced and validated in either DTD-declared or XML-Schema-declared form, selected by configuration; in DTD form the produced document MUST declare its document type public identifier.

#### Scenario: Invoice validation switched off

- **GIVEN** invoice validation is disabled and purchase order validation is enabled
- **WHEN** an invoice and a purchase order are received
- **THEN** only the purchase order is validated against its document type

#### Scenario: Schema form selected

- **GIVEN** the deployment selects XML Schema validation
- **WHEN** a partner supplier order is produced
- **THEN** it is produced without a document type declaration and is validated against the partner XML Schema

### Requirement: Document type check

When validation is enabled, the system MUST reject an inbound document that declares a document type whose public identifier differs from the one expected, with the error `Document not of type`. A document that declares no document type SHALL be accepted without this check.

#### Scenario: Mismatched document type

- **GIVEN** validation is enabled and a document declaring the `SupplierOrder 1.1` document type
- **WHEN** it is read as a purchase order
- **THEN** it is rejected with `Document not of type`

#### Scenario: No document type declared

- **GIVEN** validation is enabled and a purchase order document with no document type declaration
- **WHEN** it is read
- **THEN** the document type check passes

### Requirement: Malformed and invalid document handling

The system MUST reject an inbound document that is not well-formed XML. When validation is enabled and a well-formed document violates its schema, the system SHALL log the violation and continue processing the document.

#### Scenario: Malformed document

- **GIVEN** an inbound document with an unclosed element
- **WHEN** it is parsed
- **THEN** parsing fails and the document is not processed

#### Scenario: Schema violation

- **GIVEN** validation is enabled and a well-formed purchase order missing its `TotalPrice` element
- **WHEN** it is parsed
- **THEN** the violation is logged and parsing continues

### Requirement: Schema resolution

The system SHALL resolve the schemas referenced by exchanged documents from local copies, in this order: a caller-supplied resolver; the entity catalog mapping of the document type identifier, where a deployment-supplied catalog overrides the bundled one; the document's own system location; a bundled resource at that path. When none resolves, the system SHALL fall back to default resolution rather than fail. The order centre SHALL publish its catalog so partners resolve the `TPA-LineItem`, `TPA-SupplierOrder` and `TPA-Invoice` identifiers to schema files it serves.

#### Scenario: Deployment catalog overrides bundled mapping

- **GIVEN** the bundled catalog and a deployment catalog both map the `TPA-Invoice` identifier, to different locations
- **WHEN** an invoice is parsed
- **THEN** the schema is loaded from the deployment catalog's location

#### Scenario: Unmapped identifier

- **GIVEN** a document whose identifier is in neither catalog
- **WHEN** it is parsed
- **THEN** the schema location named in the document is used

### Requirement: Asynchronous partner exchange

The system SHALL exchange documents with the supplier asynchronously. Each approved order's supplier purchase order MUST be delivered to the supplier's purchase order inbox as one message per order. Supplier invoices SHALL be published on a publish/subscribe channel, one message per invoice, so that each invoice reaches both order fulfilment and customer notification independently.

#### Scenario: Approval yields supplier messages

- **GIVEN** two orders approved in the same batch
- **WHEN** the approval is processed
- **THEN** two separate supplier purchase order messages are delivered to the supplier inbox

#### Scenario: Invoice fan-out

- **GIVEN** the supplier publishes one invoice
- **WHEN** it is delivered
- **THEN** order fulfilment and customer notification each receive their own copy

### Requirement: Supplier order intake is atomic

The supplier MUST process each inbound purchase order message as a single unit: when the order cannot be parsed or persisted, or its invoice cannot be published, the order SHALL NOT be recorded and the message SHALL be returned for redelivery.

#### Scenario: Invoice publication fails

- **GIVEN** a valid inbound supplier purchase order and an unavailable invoice channel
- **WHEN** the supplier processes the message
- **THEN** no supplier order is recorded and the message is redelivered

#### Scenario: Malformed order message

- **GIVEN** an inbound order message that is not well-formed
- **WHEN** the supplier processes it
- **THEN** no supplier order is recorded

### Requirement: Supplier invoice publication

The supplier SHALL publish one invoice message to the order centre's invoice channel for every shipment, both when an incoming order ships immediately and when a stock update ships previously pending orders.

#### Scenario: Stock arrival ships pending orders

- **GIVEN** two pending supplier orders waiting on the same item
- **WHEN** a stock update allows both to ship
- **THEN** two invoice messages are published

### Requirement: Legacy version 1.0 document formats

The system MAY accept the version 1.0 purchase order format; whether this format is still required is unresolved. Where it is accepted, the system SHALL read from it the order id, user id, email, order date, ship-to and bill-to addresses (first name, last name, street, city, state, country, zip), total price, credit card (number, expiry date, card type), one or more line items (category, product, item, line number, quantity, unit price), and a locale that SHALL default to `en_US` when absent.

#### Scenario: Version 1.0 purchase order received

- **GIVEN** a version 1.0 purchase order with two line items and no locale attribute
- **WHEN** it is received and version 1.0 support is retained
- **THEN** its ship-to and bill-to addresses, card and two line items are read and its locale is `en_US`
