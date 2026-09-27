## Why

The legacy Pet Store exchanges orders and invoices with its supplier as XML documents over asynchronous channels. Those formats are a contract with trading partners, and none of them is documented outside the code, DTDs and XSDs. The rebuild must reproduce them exactly, or existing partners stop interoperating. This change records the contract as extracted in SX-0001, so it can be built and verified against.

## What Changes

- Specify the customer purchase order document (`PurchaseOrder` 1.1) and its embedded elements: contact information, address, credit card and order line item. This includes read-side rejection rules and the date fallback.
- Specify the internal supplier order document (`SupplierOrder` 1.1).
- Specify the trading-partner formats: supplier order (`TPASupplierOrder`), invoice (`TPAInvoice`) and line item (`TPALineItem`), with value ranges and item uniqueness.
- Specify partner order intake (conversion to the internal format) and invoice intake at the order centre.
- Specify cross-cutting document behaviour: UTF-8 indented output, required values, configurable DTD/XSD validation, the document type check, lenient handling of schema violations, and catalog-based schema resolution.
- Specify the asynchronous exchange: one supplier message per approved order, fan-out of each invoice to fulfilment and notification, atomic supplier intake with redelivery, and one invoice per shipment.
- Record the unresolved version 1.0 formats as optional support.

## Capabilities

### New Capabilities

- `b2b-document-exchange`: document formats, validation and asynchronous channels used between the storefront, the order processing centre and the supplier.

### Modified Capabilities

## Impact

- Server side only (Nitro routes and server modules); no screens were extracted.
- Needs an XML parser/serializer that supports DTD and XSD validation, and a messaging mechanism with point-to-point and fan-out semantics within the pinned stack (see design.md D1, D2).
- Interfaces with order approval (source of supplier orders), order fulfilment and customer notifications (invoice consumers), and supplier inventory (source of shipments).
- Eleven disputed or low-confidence points (design.md R1–R11) need a human ruling. Three of them are open questions.
