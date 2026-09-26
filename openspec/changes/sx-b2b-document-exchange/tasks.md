## 1. XML infrastructure

- [ ] 1.1 Select and wire an XML parser/serializer supporting DTD and XSD validation on the server
- [ ] 1.2 Implement UTF-8, indented document serialization with optional DOCTYPE public/system identifiers
- [ ] 1.3 Implement element builders that fail with an error naming the element when a value is null and accept empty strings
- [ ] 1.4 Implement positional child readers that reject missing, out-of-order or empty required elements with element-named errors
- [ ] 1.5 Implement the document type check (reject mismatched public identifier, pass when no DOCTYPE)
- [ ] 1.6 Implement parse error handling: reject malformed XML, log schema violations and continue
- [ ] 1.7 Implement the entity catalog resolver with the four-step resolution order and deployment catalog override
- [ ] 1.8 Serve the order centre entity catalog for TPA-LineItem, TPA-SupplierOrder and TPA-Invoice identifiers
- [ ] 1.9 Add per-document-type validation switches and the DTD/XSD form selector to server configuration

## 2. Shared document elements

- [ ] 2.1 Implement the ContactInfo element writer and reader, with the empty-Email exception
- [ ] 2.2 Implement the Address element writer with a conditional second StreetName and empty elements for absent values
- [ ] 2.3 Implement the Address element reader with strict ordering and required Country
- [ ] 2.4 Implement the CreditCard element writer and reader
- [ ] 2.5 Implement the order LineItem element writer and reader with integer Quantity and decimal UnitPrice
- [ ] 2.6 Ensure line item export omits the shipped quantity
- [ ] 2.7 Bundle the ContactInfo, Address, CreditCard and LineItem 1.1 schemas

## 3. Order documents

- [ ] 3.1 Implement the PurchaseOrder 1.1 writer with locale attribute and element order
- [ ] 3.2 Implement the PurchaseOrder 1.1 reader with root check, default validation and locale default en_US
- [ ] 3.3 Implement yyyy-MM-dd order date formatting and the current-date fallback on read
- [ ] 3.4 Implement the internal SupplierOrder 1.1 writer and reader with root check and date fallback
- [ ] 3.5 Bundle the PurchaseOrder 1.1 and SupplierOrder 1.1 schemas

## 4. Partner documents

- [ ] 4.1 Implement the TPASupplierOrder builder (namespace, element order, nine-field shipping address)
- [ ] 4.2 Build the partner supplier order from an approved order, sending street line 1 only
- [ ] 4.3 Implement the TPALineItem attribute writer with whole-number quantity and decimal unit price
- [ ] 4.4 Implement the TPAInvoice builder with order id, user id, order date, shipping date and line items
- [ ] 4.5 Bundle the TPASupplierOrder, TPAInvoice and TPALineItem DTDs and XSDs, including value ranges and item-id uniqueness
- [ ] 4.6 Implement partner supplier order intake converting TPA format to the internal SupplierOrder, passing 1.1 through unchanged
- [ ] 4.7 Implement invoice intake: root and namespace check, OrderId and itemId-to-quantity extraction

## 5. Asynchronous exchange

- [ ] 5.1 Record the messaging mechanism decision in ARCHITECTURE.md Key Decisions
- [ ] 5.2 Implement the supplier purchase order channel, one message per approved order
- [ ] 5.3 Implement the invoice channel with independent delivery to order fulfilment and customer notification
- [ ] 5.4 Make supplier order intake atomic, with no persisted order and redelivery on any failure
- [ ] 5.5 Publish one invoice per shipment for immediate shipments and stock-update shipments

## 6. Open decisions

- [ ] 6.1 Obtain rulings on the address Country requirement, schema-violation rejection and version 1.0 support
- [ ] 6.2 Implement version 1.0 purchase order format intake if retained

## 7. Tests

- [ ] 7.1 Round-trip and rejection tests for each shared element
- [ ] 7.2 PurchaseOrder and SupplierOrder document tests including date fallback and root checks
- [ ] 7.3 Partner document schema tests: zero price accepted, zero quantity rejected, duplicate item id rejected
- [ ] 7.4 Validation switch, document type check and malformed-input tests
- [ ] 7.5 Entity resolution order tests with bundled and deployment catalogs
- [ ] 7.6 Channel tests for invoice fan-out, one-message-per-order and intake rollback with redelivery
