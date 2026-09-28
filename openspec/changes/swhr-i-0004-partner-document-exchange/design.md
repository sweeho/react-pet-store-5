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
- **R2. Schema violations and supplier order intake (SME ruling).** The legacy parser error handler logs `error()` and returns; only `fatalError()` (malformed XML) aborts (`XMLDocumentUtils.java:588-603`). An SME has ruled on B2BDOC-RULE-0002: validation of inbound supplier-order and outbound invoice documents is configurable per deployment, and when enabled a supplier-order document that fails validation SHALL NOT be persisted. The spec states this as the "Supplier order document validation" requirement, so the rebuild must treat schema errors on this path as rejecting, not merely logged. Other document types keep the legacy log-and-continue behaviour.
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
- Q2. Should schema-invalid documents other than supplier orders be rejected in the rebuild (R2)? Supplier-order intake is resolved by SME ruling: reject without persisting.
- Q3. Is `Country` required on inbound addresses (R1)?

## Planning (SWHR-S-0003)

Added at sprint planning (SWHR-T-0025). Everything above this heading is the adopted specification and is unchanged; this section records what the repository actually contains, the decisions that make the spec buildable on it, and how the work is phased. Implementation agents read this section before their `PLAN.md`.

### Codebase findings

- **No XML, orders, supplier or messaging code exists.** `package.json` has no XML library. `db/schema.ts` has `users`, `profiles` and the locale-keyed catalog only. `lib/` has `locale`, `catalog`, `email`, `orders/locale.ts` (the order-locale default from swhr-i-0003) and nothing else. There is no outbox, queue or background worker.
- **No legacy schema sources.** No `.dtd`, `.xsd` or `.xsl` file is in the repository. The only wire-format source is `specs/b2b-document-exchange/spec.md` plus the trace table in D3 above.
- **Toolchain probe (Bun 1.4.2, linux-arm64, 2026-09-28).** `@xmldom/xmldom` 0.9 parses and serializes, keeps `doctype.publicId`/`systemId`, and throws through its `onError` hook on a malformed document. `xmllint-wasm` 5.3 validates against XSD (an `xs:unique` duplicate and a `positiveInteger` of 0 were both rejected) but its build has no `--valid`/`--dtdvalid`, so it cannot validate against a DTD. `libxmljs` and `libxmljs2` fail to build under Bun. No system `xmllint` is installed.
- **Test harness.** `lib/**/*.test.ts` already run in the Vitest `server` project (node environment, under `bun --bun`), and `tsconfig.node.json` includes `lib`. A new top-level `plugins/` directory is not in `tsconfig.node.json`'s `include` yet.
- **CI.** `.github/workflows/ci.yml` triggers on push and pull request to `vortex/**`, `dev` and `main`. No change is needed.
- **Later changes already on disk.** order-fulfillment (swhr-i-0011) design D1 defines `supplier_orders`, `supplier_contacts`, `supplier_addresses` and `supplier_line_items` (money as integer cents, status CHECK over four values, F6), and D3 defines the same outbox-and-dispatcher mechanism. supplier-inventory (swhr-i-0012) D3 writes invoices to that outbox. `architecture/rebuild-guidance.md` §3.2 recommends one outbox, and §1 forbids XML-over-POST in the rebuild's HTTP API.

### Planning decisions

- **P1. XML toolchain.** `@xmldom/xmldom` for parsing, DOM building and serialization; `xmllint-wasm` for validation, which is asynchronous (it runs in a worker). Because DTD validation is unavailable (finding above), every DTD is bundled together with an equivalent XSD (`<Name>.dtd.xsd`), and DTD-form documents are validated against that equivalent. The `.dtd` files are still bundled and served to partners. D2 above allows this.
- **P2. Money in documents is a decimal string.** Document types carry `unitPrice` and `totalPrice` as decimal strings, written exactly as given with no float round-trip (R8). Conversion to integer minor units happens only where a document is persisted (`supplier_line_items`), with exact string arithmetic.
- **P3. Document dates.** `yyyy-MM-dd` in the server's local time zone, matching the legacy formatter (R3). Parsing a missing or invalid date yields `null`; the document reader then substitutes "now" from an injectable clock.
- **P4. Outbox.** Two tables: `outbox_messages` (id, channel, payload, created_at) and `outbox_deliveries` (message id, consumer, status `pending`/`delivered`/`dead`, attempts, last_error, next_attempt_at). Each channel has a fixed subscriber list, so a message gets one delivery row per subscriber at enqueue time: `supplier.purchase-order` → `supplier-intake`; `opc.invoice` → `order-fulfillment` and `customer-notification`. A handler has two phases: an async prepare step (parse, validate) and a synchronous commit step that receives the transaction. The dispatcher runs the commit and marks the delivery delivered inside one `db.transaction()`. Any throw rolls back, increments `attempts` and schedules a retry. After `OUTBOX_MAX_ATTEMPTS` failed attempts (default 10) the delivery becomes `dead` and is kept for inspection. A delivery with no registered handler stays `pending`, so nothing is lost before fulfilment and notifications exist. A Nitro server plugin polls every `OUTBOX_POLL_MS` (default 1000 ms) and is inactive under Vitest. Checkout, fulfilment, supplier-inventory and notifications reuse this outbox rather than adding their own.
- **P5. Supplier-order tables are built here, in order-fulfillment D1's shape.** `SWHR-R-0047` and `SWHR-R-0050` need "recorded / not recorded", so this change creates `supplier_orders` (status CHECK over `PENDING`, `APPROVED`, `DENIED`, `COMPLETED`, created `PENDING`), `supplier_contacts`, `supplier_addresses` and `supplier_line_items` (integer-cent `unit_price`, `quantity_shipped` default 0). order-fulfillment extends these tables and must not recreate them.
- **P6. Seams, not callers.** Order approval, stock updates, fulfilment and notifications are later capabilities. This change exposes the functions they will call and tests the scenarios through them: `sendSupplierPurchaseOrders` (one message per approved order), `publishInvoices` (one message per shipment), the supplier-intake handler with an injected `shipOnReceipt` hook (default: ships nothing), and consumer registration for the two invoice subscribers.
- **P7. Configuration.** Environment variables, read in one module: `B2B_VALIDATE_PURCHASE_ORDER`, `B2B_VALIDATE_ORDER_APPROVAL`, `B2B_VALIDATE_INVOICE` and `B2B_VALIDATE_SUPPLIER_ORDER` (each on unless set to `false`); `B2B_SCHEMA_FORM` (`dtd` by default, or `xsd`); and `B2B_ENTITY_CATALOG` (the path to a deployment catalog that overrides the bundled mappings).
- **P8. HTTP surface.** Only `GET /api/b2b/entity-catalog`, which publishes the identifier-to-URL mappings, and `GET /api/b2b/schemas/:file`, which serves a bundled schema. There is no XML-over-POST intake (rebuild-guidance §1); the channels are in-process.
- **P9. Public identifiers.** The spec gives two full identifiers (PurchaseOrder 1.1, SupplierOrder 1.1). The rest follow the same Blueprints pattern and are defined once in the bundled catalog: `-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD <Name> <version>//EN` for ContactInfo, Address, CreditCard and LineItem 1.1; TPA-SupplierOrder, TPA-Invoice and TPA-LineItem 1.0; and PurchaseOrder 1.0.

### Spec discrepancies

Recorded here and on the planning ticket; the delta spec is not edited.

- **SD-1. Wire formats cannot be checked against legacy files.** No DTD, XSD or XSL is in the repository, and the full public identifiers of the element and TPA documents are not stated (P9 assumes them). Schemas are authored from the spec text, so "byte-compatible" means compatible with the spec, not verified against the legacy files. Confidence: medium.
- **SD-2. DTD validation is not available** in any XML library that works under Bun here. P1 substitutes DTD-equivalent XSDs.
- **SD-3. Upstream and downstream capabilities do not exist.** "Approved order", "stock arrival", "order fulfilment" and "customer notification" in `SWHR-R-0035`, `SWHR-R-0049` and `SWHR-R-0051` are exercised through the P6 seams, with test consumers.
- **SD-4. Supplier-order persistence belongs to order-fulfillment** (rebuild-guidance §3.1, fulfilment D1). It is built here in that shape (P5) because this change's scenarios need it.
- **SD-5. The outbox is built earlier than rebuild-guidance §3.2 suggests** ("when checkout first needs it"): b2b-document-exchange is build order 2 and needs it first. P4 covers what fulfilment D3 asks for, including the retry cap it leaves open.
- **SD-6. The version 1.0 element names are not recoverable.** `SWHR-R-0052` lists the fields only, and the 1.0 DTD is not in the repository. The 1.0 reader defines its element names from the 1.1 and TPA conventions, and its test fixture is authored to match. Confidence: low. Ruling requested in SWHR-T-0035 (Q1).
- **SD-7. The order-approval validation switch has nothing to validate.** `SWHR-R-0044` names an order-approval document switch, but no order-approval document requirement exists in this change. The switch is configuration only.
- **SD-8. Tests have their own task group (7).** Each implementing TASK still writes the approved test cases (`SWHR-C-*` in `test-cases.md`) for the scenarios it implements, named with their ids. SWHR-T-0034 audits that every case is covered, and adds the cross-module flow test.
- **SD-9. "Reported as invalid" is not "rejected".** `SWHR-R-0024.03`, `SWHR-R-0039.02` and `SWHR-R-0044.01` observe validation results. Rejection happens only for malformed XML (`SWHR-R-0046.01`) and invalid supplier orders (`SWHR-R-0047`). Every other schema violation is logged and processing continues (`SWHR-R-0046.02`, Q2).

### Phases

| Phase                                     | Ticket      | Group | Depends on               |
| ----------------------------------------- | ----------- | ----- | ------------------------ |
| 1. XML infrastructure                     | SWHR-T-0028 | 1     | —                        |
| 2. Shared elements                        | SWHR-T-0029 | 2     | SWHR-T-0028              |
| 3. Order documents                        | SWHR-T-0030 | 3     | SWHR-T-0029              |
| 4. Partner documents                      | SWHR-T-0031 | 4     | SWHR-T-0030              |
| 5. Asynchronous exchange                  | SWHR-T-0033 | 5     | SWHR-T-0031              |
| 6. Version 1.0 intake (parallel with 4–5) | SWHR-T-0032 | 6     | SWHR-T-0030              |
| 7. Test suite                             | SWHR-T-0034 | 7     | SWHR-T-0033, SWHR-T-0032 |

- **Test-harness phase.** No new harness is needed. Every test is a `lib/**/*.test.ts` in the Vitest `server` project; SWHR-T-0028 confirms that the `xmllint-wasm` worker runs under `bun --bun vitest`. There is no screen, so no Playwright spec is added. Validation's E2E run at integration QA covers the storefront regression suite unchanged.
- **CI phase.** The existing workflow already runs lint, typecheck, unit and E2E on every `vortex/**` push and pull request. No workflow change is needed.
- **tasks.md 5.1 and 6.1.** 5.1 (record the messaging decision) is done at planning: P4 is promoted to the ARCHITECTURE Key Decisions. 6.1 (obtain rulings) is raised as SWHR-T-0035. Both boxes carry their group's ticket key and are ticked when that ticket merges.

### Interface contracts

These are fixed at planning. Later tickets code against them, and a ticket may add exports but must not change these.

```ts
// lib/b2b/xml/*  (SWHR-T-0028)
export interface DocTypeDecl {
  name: string;
  publicId: string;
  systemId: string;
}
export function createDocument(rootName: string, namespace?: string): Document;
export function appendTextElement(
  parent: Element,
  name: string,
  value: string | null | undefined,
  namespace?: string,
): Element; // null/undefined -> MissingValueError naming `name`; "" -> empty element
export function serializeDocument(doc: Document, doctype?: DocTypeDecl): string; // `<?xml version="1.0" encoding="UTF-8"?>`, indented
export function parseDocument(xml: string): Document; // not well-formed -> MalformedDocumentError
export function expectRoot(el: Element, name: string, namespace?: string): void; // -> DocumentReadError(`${name} element expected.`)
export class ChildReader {
  // positional, element children only
  constructor(parent: Element);
  text(name: string, opts?: { allowEmpty?: boolean }): string; // missing/out of order -> `${name} element expected.`; empty -> `${name} element: content expected.`
  optionalText(name: string): string | null;
  element(name: string): Element;
  elements(name: string, min?: number): Element[];
  end(): void; // unexpected trailing element -> DocumentReadError
}
export function checkDocumentType(doc: Document, expectedPublicId: string): void; // mismatch -> DocumentReadError("Document not of type ..."); no DOCTYPE -> passes
export function formatDocumentDate(d: Date): string; // yyyy-MM-dd, local time zone
export function parseDocumentDate(s: string | null): Date | null;
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
export function validateDocument(xml: string, schemaKey: string): Promise<ValidationResult>; // schemaKey = public id or namespace; resolved via resolveEntity
export function resolveEntity(
  publicId: string | null,
  systemId: string | null,
  opts?: { resolver?: EntityResolver },
): ResolvedEntity | null;
export class MissingValueError extends Error {}
export class MalformedDocumentError extends Error {}
export class DocumentReadError extends Error {}
// lib/b2b/config.ts
export type DocumentKind = "purchaseOrder" | "orderApproval" | "invoice" | "supplierOrder";
export function isValidationEnabled(kind: DocumentKind): boolean;
export function getSchemaForm(): "dtd" | "xsd";

// lib/b2b/elements/*  (SWHR-T-0029) — writeX(parent, value) appends and returns the element; readX(el) throws DocumentReadError
export interface Address {
  streetName1: string;
  streetName2?: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
}
export interface ContactInfo {
  familyName: string;
  givenName: string;
  address: Address;
  email: string;
  phone: string;
}
export interface CreditCard {
  cardNumber: string;
  cardType: string;
  expiryDate: string;
}
export interface LineItem {
  categoryId: string;
  productId: string;
  itemId: string;
  lineNum: number;
  quantity: number;
  unitPrice: string;
} // unitPrice decimal string (P2)
export interface StoredLineItem extends LineItem {
  quantityShipped: number;
}
export function toExportLineItem(line: StoredLineItem): LineItem;

// lib/b2b/documents/*  (SWHR-T-0030; v1.0 reader SWHR-T-0032)
export interface PurchaseOrder {
  locale: string;
  orderId: string;
  userId: string;
  emailId: string;
  orderDate: Date;
  shippingInfo: ContactInfo;
  billingInfo: ContactInfo;
  totalPrice: string;
  creditCard: CreditCard;
  lineItems: LineItem[];
}
export interface SupplierOrder {
  orderId: string;
  orderDate: Date;
  shippingInfo: ContactInfo;
  lineItems: LineItem[];
}
export interface ReadOptions {
  validate?: boolean;
  now?: () => Date;
  log?: (msg: string) => void;
}
export function writePurchaseOrder(po: PurchaseOrder): string;
export function readPurchaseOrder(xml: string, opts?: ReadOptions): Promise<PurchaseOrder>;
export function writeSupplierOrder(so: SupplierOrder): string;
export function readSupplierOrder(xml: string, opts?: ReadOptions): Promise<SupplierOrder>;
export function readPurchaseOrderV1(xml: string, opts?: ReadOptions): Promise<PurchaseOrder>; // SWHR-T-0032

// lib/b2b/partner/*  (SWHR-T-0031)
export interface PartnerInvoice {
  orderId: string;
  userId: string;
  orderDate: Date;
  shippingDate: Date;
  lineItems: LineItem[];
}
export function buildPartnerSupplierOrder(
  order: SupplierOrder,
  opts?: { form?: "dtd" | "xsd" },
): string;
export function buildPartnerInvoice(
  invoice: PartnerInvoice,
  opts?: { form?: "dtd" | "xsd" },
): string;
export function intakeSupplierOrder(xml: string, opts?: ReadOptions): Promise<SupplierOrder>; // TPA -> internal; SupplierOrder 1.1 passes through
export function readPartnerInvoice(
  xml: string,
  opts?: ReadOptions,
): Promise<{ orderId: string; shipped: Record<string, number> }>;
export class DocumentInvalidError extends Error {
  errors: string[];
}

// lib/messaging/outbox.ts  (SWHR-T-0033)
export type Channel = "supplier.purchase-order" | "opc.invoice";
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Handler = (payload: string) => Promise<(tx: Tx) => void>; // async prepare, sync commit
export function enqueue(tx: Tx, channel: Channel, payload: string): string;
export function registerConsumer(channel: Channel, consumer: string, handler: Handler): void;
export function dispatchPending(opts?: {
  now?: Date;
}): Promise<{ delivered: number; failed: number }>;
// lib/b2b/exchange/*  (SWHR-T-0033)
export function sendSupplierPurchaseOrders(tx: Tx, orders: SupplierOrder[]): void; // one message per order
export function publishInvoices(tx: Tx, invoices: PartnerInvoice[]): void; // one message per shipment
export function createSupplierIntakeHandler(opts?: {
  shipOnReceipt?: (tx: Tx, order: SupplierOrder) => PartnerInvoice[];
}): Handler;
```
