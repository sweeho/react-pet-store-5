## 1. XML infrastructure

- [x] 1.1 Select and wire an XML parser/serializer supporting DTD and XSD validation on the server (SWHR-T-0028)
- [x] 1.2 Implement UTF-8, indented document serialization with optional DOCTYPE public/system identifiers (SWHR-T-0028)
- [x] 1.3 Implement element builders that fail with an error naming the element when a value is null and accept empty strings (SWHR-T-0028)
- [x] 1.4 Implement positional child readers that reject missing, out-of-order or empty required elements with element-named errors (SWHR-T-0028)
- [x] 1.5 Implement the document type check (reject mismatched public identifier, pass when no DOCTYPE) (SWHR-T-0028)
- [x] 1.6 Implement parse error handling: reject malformed XML, log schema violations and continue (SWHR-T-0028)
- [x] 1.7 Implement the entity catalog resolver with the four-step resolution order and deployment catalog override (SWHR-T-0028)
- [x] 1.8 Serve the order centre entity catalog for TPA-LineItem, TPA-SupplierOrder and TPA-Invoice identifiers (SWHR-T-0028)
- [x] 1.9 Add per-document-type validation switches and the DTD/XSD form selector to server configuration (SWHR-T-0028)

## 2. Shared document elements

- [x] 2.1 Implement the ContactInfo element writer and reader, with the empty-Email exception (SWHR-T-0029)
- [x] 2.2 Implement the Address element writer with a conditional second StreetName and empty elements for absent values (SWHR-T-0029)
- [x] 2.3 Implement the Address element reader with strict ordering and required Country (SWHR-T-0029)
- [x] 2.4 Implement the CreditCard element writer and reader (SWHR-T-0029)
- [x] 2.5 Implement the order LineItem element writer and reader with integer Quantity and decimal UnitPrice (SWHR-T-0029)
- [x] 2.6 Ensure line item export omits the shipped quantity (SWHR-T-0029)
- [x] 2.7 Bundle the ContactInfo, Address, CreditCard and LineItem 1.1 schemas (SWHR-T-0029)

## 3. Order documents

- [x] 3.1 Implement the PurchaseOrder 1.1 writer with locale attribute and element order (SWHR-T-0030)
- [x] 3.2 Implement the PurchaseOrder 1.1 reader with root check, default validation and locale default en_US (SWHR-T-0030)
- [x] 3.3 Implement yyyy-MM-dd order date formatting and the current-date fallback on read (SWHR-T-0030)
- [x] 3.4 Implement the internal SupplierOrder 1.1 writer and reader with root check and date fallback (SWHR-T-0030)
- [x] 3.5 Bundle the PurchaseOrder 1.1 and SupplierOrder 1.1 schemas (SWHR-T-0030)

## 4. Partner documents

- [ ] 4.1 Implement the TPASupplierOrder builder (namespace, element order, nine-field shipping address) (SWHR-T-0031)
- [ ] 4.2 Build the partner supplier order from an approved order, sending street line 1 only (SWHR-T-0031)
- [ ] 4.3 Implement the TPALineItem attribute writer with whole-number quantity and decimal unit price (SWHR-T-0031)
- [ ] 4.4 Implement the TPAInvoice builder with order id, user id, order date, shipping date and line items (SWHR-T-0031)
- [ ] 4.5 Bundle the TPASupplierOrder, TPAInvoice and TPALineItem DTDs and XSDs, including value ranges and item-id uniqueness (SWHR-T-0031)
- [ ] 4.6 Implement partner supplier order intake converting TPA format to the internal SupplierOrder, passing 1.1 through unchanged (SWHR-T-0031)
- [ ] 4.7 Implement invoice intake: root and namespace check, OrderId and itemId-to-quantity extraction (SWHR-T-0031)

## 5. Asynchronous exchange

- [ ] 5.1 Record the messaging mechanism decision in ARCHITECTURE.md Key Decisions (SWHR-T-0033)
- [ ] 5.2 Implement the supplier purchase order channel, one message per approved order (SWHR-T-0033)
- [ ] 5.3 Implement the invoice channel with independent delivery to order fulfilment and customer notification (SWHR-T-0033)
- [ ] 5.4 Make supplier order intake atomic, with no persisted order and redelivery on any failure (SWHR-T-0033)
- [ ] 5.5 Publish one invoice per shipment for immediate shipments and stock-update shipments (SWHR-T-0033)
- [ ] 5.6 Reject supplier-order intake without persisting when validation is enabled and the document fails it (SWHR-T-0033)

## 6. Open decisions

- [ ] 6.1 Obtain rulings on the address Country requirement, schema-violation rejection for non-supplier-order documents and version 1.0 support (SWHR-T-0032)
- [ ] 6.2 Implement version 1.0 purchase order format intake if retained (SWHR-T-0032)

## 7. Tests

- [ ] 7.1 Round-trip and rejection tests for each shared element (SWHR-T-0034)
- [ ] 7.2 PurchaseOrder and SupplierOrder document tests including date fallback and root checks (SWHR-T-0034)
- [ ] 7.3 Partner document schema tests: zero price accepted, zero quantity rejected, duplicate item id rejected (SWHR-T-0034)
- [ ] 7.4 Validation switch, document type check and malformed-input tests (SWHR-T-0034)
- [ ] 7.5 Entity resolution order tests with bundled and deployment catalogs (SWHR-T-0034)
- [ ] 7.6 Channel tests for invoice fan-out, one-message-per-order and intake rollback with redelivery (SWHR-T-0034)
- [ ] 7.7 Supplier-order validation tests: invalid document not persisted when enabled, unvalidated when disabled (SWHR-T-0034)
