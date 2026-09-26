## Context

This change records the business-to-business document exchange of the legacy Java Pet Store 1.3.2 as extracted in SX-0001. It covers the XML documents that pass between the storefront, the order processing centre (OPC) and the supplier, and the channels that carry them. The source is 69 pass records (pass A + pass B, merged server-side to 34) with `capability_key: b2b-document-exchange`, read from these modules:

| Module                                                                                         | What it contributes                                                                                       |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `components/purchaseorder`                                                                     | `PurchaseOrder` 1.1 document: structure, root check, date format and fallback                             |
| `components/contactinfo`, `components/address`, `components/creditcard`, `components/lineitem` | The reusable elements embedded in order documents                                                         |
| `components/supplierpo`                                                                        | Internal `SupplierOrder` 1.1 document                                                                     |
| `components/xmldocuments`                                                                      | Partner (TPA) supplier order, invoice and line item formats; parser, serializer, entity resolver          |
| `apps/opc`                                                                                     | Building the partner supplier order from an approved order; invoice intake; validation switches; channels |
| `apps/supplier`                                                                                | Partner order intake and transform; invoice publication; transactional intake                             |

The wire formats (element names, namespaces, public identifiers) are kept verbatim in `spec.md` because they are the contract with trading partners, not legacy implementation. Class names, JMS names and EJB attributes are kept here only.

## Goals / Non-Goals

**Goals:**

- Reproduce every document format byte-compatible at the element and attribute level, so an existing partner can exchange with the rebuild unchanged.
- Preserve the observable validation behaviour, including the lenient paths (date fallback, logged schema violations), until a human rules on the disputes below.

**Non-Goals:**

- What order fulfilment does with an invoice after intake (shipped-quantity bookkeeping, order status) belongs to the order-fulfilment/order-approval capabilities.
- Customer e-mail content on invoice receipt belongs to `customer-notifications`.
- Supplier inventory and pending-order logic belongs to `supplier-inventory`; only the fact that an invoice is published per shipment is here.

## User interface

No screen records were extracted for this capability; its user interface is unspecified. The only web-served artefact is the entity catalog the order centre publishes for schema resolution (legacy `EntityCatalog.jsp`), which is a machine-readable endpoint, not a screen.

## Decisions

### D1. Target stack mapping

The rebuild is a Vite SPA + Nitro (H3) server with SQLite/Drizzle. The legacy JMS queue/topic has no equivalent in the pinned stack. The implementing team must pick an in-process or durable mechanism that preserves the two semantics in the spec: point-to-point, one message per supplier order, with redelivery on failure; and fan-out of each invoice to two independent consumers. A SQLite-backed outbox table (one row per message, per-consumer delivery state) satisfies both without adding a broker. Record the choice in ARCHITECTURE.md `## Key Decisions`.

### D2. XML handling

DTD validation and XSD validation are both part of the contract (configurable per deployment). The rebuild needs an XML parser capable of both, or must ship XSDs equivalent to each 1.1 DTD. That choice is left to implementation.

### D3. Requirement-to-source traces

| Requirement                                | Records                                                                                 | Primary traces                                                                                                                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purchase order document structure          | purchaseorder a BR-0001, b RULE-0001                                                    | `components/purchaseorder/.../rsrc/schemas/PurchaseOrder.dtd:38-56`; `PurchaseOrder.java:256-276, 282-320`                                                                            |
| Purchase order document root check         | purchaseorder a BR-0002, BR-0003; b RULE-0002                                           | `PurchaseOrder.java:60-62, 225-235, 282-284, 318-320`; `apps/opc/.../PurchaseOrderMDB.java:153`                                                                                       |
| Purchase order date handling               | purchaseorder a BR-0004; b RULE-0003                                                    | `PurchaseOrder.java:73, 262, 297-303`                                                                                                                                                 |
| Contact information element                | contactinfo a INTEGRATION-0001, RULE-0001; b INTEG-0001, RULE-0001                      | `ContactInfo.dtd:38-46`; `ContactInfo.java:133-161`; `XMLDocumentUtils.java:153-170`                                                                                                  |
| Address element output                     | address a BUSINESS-RULE-0001; b BUSINESS-RULE-0001                                      | `Address.java:144-155`; `XMLDocumentUtils.java:297-302`                                                                                                                               |
| Address element input                      | address a ENTITY-0001, BUSINESS-RULE-0002; b INTEGRATION-0001, BUSINESS-RULE-0002       | `Address.dtd:38-43`; `Address.java:54-61, 157-180`; `XMLDocumentUtils.java:138-164`                                                                                                   |
| Credit card element                        | creditcard a INT-0001, RULE-0001; b INTEGRATION-0001, BUSINESS-RULE-0001                | `CreditCard.dtd:38-41`; `CreditCard.java:54-59, 108-130`                                                                                                                              |
| Order line item element                    | lineitem a integration-0001, business-rule-0001; b INTEGRATION-0001, BUSINESS-RULE-0001 | `LineItem.dtd:38-50`; `LineItem.java:54-62, 137-163`                                                                                                                                  |
| Line item export excludes shipped quantity | lineitem a business-rule-0002; b BUSINESS-RULE-0002                                     | `LineItemEJB.java:171-180`; `LineItem.java:63-68`                                                                                                                                     |
| Internal supplier order document           | supplierpo a entity-0001, business-rule-0001; b INT-0001, BR-0001                       | `SupplierOrder.dtd:38-52`; `SupplierOrder.java:59-61, 154-168, 189-237`                                                                                                               |
| Internal supplier order date handling      | supplierpo a business-rule-0002, -0003; b BR-0002, BR-0003                              | `SupplierOrder.java:66, 192-193, 217-223`                                                                                                                                             |
| Partner supplier order document            | xmldocuments a integration-0001; b ENTITY-0001; opc b INTEGRATION-0001                  | `TPASupplierOrder.xsd:11-44`; `TPASupplierOrder.dtd:41, 56, 106`; `TPASupplierOrderXDE.java:119-126, 160-173`; `apps/opc/.../OrderApprovalMDB.java:248-268`                           |
| Partner supplier order intake              | supplier a BR-0003; b RULE-0001                                                         | `apps/supplier/.../SupplierOrderStyleSheetCatalog.properties:2-9`; `xsl/TPASupplierOrder.xsl:15-50`; `apps/supplier/.../TPASupplierOrderXDE.java:55-59, 86-122`                       |
| Partner invoice document                   | xmldocuments a integration-0002; b ENTITY-0002                                          | `TPAInvoice.xsd:11-31`; `TPAInvoice.dtd:41-45, 67`; `TPAInvoiceXDE.java:113-126` (xmldocuments)                                                                                       |
| Partner invoice intake                     | opc a INT-0001; b INTEGRATION-0002                                                      | `apps/opc/.../TPAInvoiceXDE.java:57-68, 123-139`                                                                                                                                      |
| Partner line item values                   | xmldocuments a business-rule-0003, -0006; b ENTITY-0003, RULE-0001                      | `TPALineItem.xsd:10-23`; `TPALineItem.dtd:39-48`; `TPALineItemUtils.java:64-77`                                                                                                       |
| Unique item per partner document           | xmldocuments a business-rule-0004; b RULE-0002                                          | `TPASupplierOrder.xsd:23-26`; `TPAInvoice.xsd:24-27`                                                                                                                                  |
| Partner document dates                     | xmldocuments a business-rule-0005; b RULE-0003                                          | `TPAInvoiceXDE.java:70, 154-164`; `TPASupplierOrderXDE.java:78, 154-158`                                                                                                              |
| Required document values                   | xmldocuments b RULE-0004                                                                | `XMLDocumentUtils.java:274-281, 319-326`                                                                                                                                              |
| Document encoding                          | xmldocuments a business-rule-0011; b REQ-0002                                           | `XMLDocumentUtils.java:56, 378-379`                                                                                                                                                   |
| Configurable document validation           | opc a BR-0002; b REQUIREMENT-0001; supplier b RULE-0002; xmldocuments b REQ-0001        | `apps/opc/src/ejb-jar.xml:120-124, 212-221`; `apps/supplier/src/ejb-jar.xml:145-164`; `TPASupplierOrderXDE.java:94-108`; `TPAInvoiceXDE.java:85-101`; `XMLDocumentUtils.java:364-386` |
| Document type check                        | xmldocuments a business-rule-0009; b RULE-0005                                          | `XMLDocumentUtils.java:438-458, 541-544, 626-634`                                                                                                                                     |
| Malformed and invalid document handling    | xmldocuments a business-rule-0009; b RULE-0006                                          | `XMLDocumentUtils.java:515-540, 588-603`                                                                                                                                              |
| Schema resolution                          | xmldocuments a integration-0010; b REQ-0003; opc a BR-0002                              | `CustomEntityResolver.java:86-97, 175-217`; `rsrc/EntityCatalog.properties:9-15`; `apps/opc/src/docroot/EntityCatalog.jsp:5-24`                                                       |
| Asynchronous partner exchange              | opc a INT-0003                                                                          | `apps/opc/src/ejb-jar.xml:205-211, 408-413`; `apps/opc/src/sun-j2ee-ri.xml:136-137, 226-229, 237-238`; `OrderApprovalTD.java:92-97`                                                   |
| Supplier order intake is atomic            | supplier a INT-0001                                                                     | `apps/supplier/src/ejb-jar.xml:85-93, 317-326`; `SupplierOrderMDB.java:101-123`                                                                                                       |
| Supplier invoice publication               | supplier a INT-0002                                                                     | `SupplierOrderTD.java:76-83`; `TopicSender.java:73-92`                                                                                                                                |
| Legacy version 1.0 document formats        | xmldocuments a entity-0013; b ENTITY-0004                                               | `components/xmldocuments/src/rsrc/schemas/PurchaseOrder.dtd:38-74`; `LineItem.dtd:38`; `EntityCatalog.properties:1-7`                                                                 |

Legacy stack metadata (for reference only): JMS `jms/supplier/PurchaseOrderQueue` (queue) and `jms/opc/InvoiceTopic` (topic, subscribers `InvoiceMDB` and `MailInvoiceMDB`); `SupplierOrderMDB` onMessage `Required`; env-entries `param/xml/validation/{PurchaseOrder,Invoice,OrderApproval,SupplierOrder}`, `param/xml/XSDValidation`, `param/xml/xsdvalidation/{SupplierOrder,Invoice}`, `url/EntityCatalogURL` → `/opc/EntityCatalog.jsp`.

## Risks / Trade-offs

Disputed and low-confidence items, for a human to rule on. The spec states observed legacy behaviour in each case. Changing it is a product decision, not an extraction fix.

- **R1. Address `Country` optional or required (disputed).** `Address.dtd:38` declares `Country?`. `Address.fromDOM` reads it with `optional=false`, so a DTD-valid address without a country is rejected in code. The spec follows the code, which is the stricter path. Pass A flagged ENTITY-0001 and BUSINESS-RULE-0002 as disputed.
- **R2. Schema violations do not reject (disputed).** The parser error handler logs `error()` and returns; only `fatalError()` (malformed XML) aborts. So "validation enabled" does not by itself stop an invalid document. Supplier record B2BDOC-RULE-0002 claims a document failing validation is not persisted. That holds only for malformed documents or for structural errors the programmatic `fromDOM` readers also catch. Verified in `XMLDocumentUtils.java:588-603`. The spec states the logging behaviour. The rebuild may choose to reject, but that must be a recorded decision.
- **R3. Date fallback (low, disputed).** Both `PurchaseOrder` and `SupplierOrder` replace a missing or unparseable `OrderDate` with "now". `SupplierOrder` marks this with a `FIX ME` comment. The time of day is always lost in transit, and the formatter uses the server's default time zone implicitly.
- **R4. Document type check bypass.** A document with no DOCTYPE passes the type check (the legacy comment blames the identity transformer for dropping DOCTYPE nodes). This is a weak point for partner input.
- **R5. Invoice `locale`.** `TPAInvoice.dtd` declares `locale` defaulting to `en_US`, but `TPAInvoice.xsd` has no locale attribute. In XSD mode an invoice carries no locale.
- **R6. Second street line dropped.** The partner supplier order carries only street line 1 (`OrderApprovalMDB.java:248-268`), so ship-to line 2 never reaches the supplier.
- **R7. `positiveDecimal` admits zero.** The partner schema's unit-price type has `minInclusive 0.0` despite its name. The spec states ≥ 0.
- **R8. Unit price as binary float.** The partner line item is written from a `float` with `Float.toString`, with no rounding. Money precision can drift. The rebuild should use a decimal representation and keep the textual output compatible.
- **R9. Item-id uniqueness is schema-only (low).** It is enforced only by `xsd:unique` in XSD mode. There is no DTD or code check.
- **R10. Version 1.0 formats (disputed, reachability unresolved).** The 1.0 purchase order, line item, supplier order and invoice DTDs are mapped under "#Old DTDs" in the catalog, but no Java caller was found (`XMLDocumentEditorFactory` has no caller). The spec states support as MAY. Drop it if no partner still sends 1.0.
- **R11. Card number in clear.** The full card number travels in the purchase order document (`risk_class: regulated`). The rebuild must decide on PCI handling before reproducing this.

## Open Questions

- Q1. Does any partner still send version 1.0 documents (R10)?
- Q2. Should schema-invalid documents be rejected in the rebuild (R2)?
- Q3. Is `Country` required on inbound addresses (R1)?
