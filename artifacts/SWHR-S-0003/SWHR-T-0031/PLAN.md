---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0003
ticket: SWHR-T-0031
idea: SWHR-I-0004
branch: Not Provided
upstream:
  [
    openspec/changes/swhr-i-0004-partner-document-exchange/design.md,
    openspec/changes/swhr-i-0004-partner-document-exchange/specs/b2b-document-exchange/spec.md,
  ]
---

# PLAN — SWHR-T-0031 · Partner documents

Change `swhr-i-0004-partner-document-exchange` · tasks.md group 4. Read `openspec/changes/swhr-i-0004-partner-document-exchange/design.md` first: §Planning (findings, P1–P9, SD-1–SD-9) and §Interface contracts. Each approved test case in `openspec/changes/swhr-i-0004-partner-document-exchange/test-cases.md` for your scenarios becomes a test whose name carries its `SWHR-C-*` id (SD-8).

## Objective

The trading-partner formats (`TPASupplierOrder`, `TPAInvoice`, `TPALineItem`) are built, validated in DTD or XSD form, and read at intake. A partner supplier order converts to the internal `SupplierOrder`, and an invoice yields its order id and shipped quantities.

## Steps

1. `lib/b2b/partner/tpaLineItem.ts`: the attribute writer (`categoryId`, `productId`, `itemId`, `lineNo`, `quantity`, `unitPrice`, in the `TPALineItem` namespace), with a whole-number quantity and the decimal string written as-is (`SWHR-R-0039`, design.md P2).
2. `lib/b2b/partner/tpaSupplierOrder.ts`: `buildPartnerSupplierOrder`, with the namespace, element order and nine-field `ShippingAddress`; `Street` = `streetName1` only (R6). In DTD form it declares the TPA-SupplierOrder DOCTYPE; in XSD form it declares none (`getSchemaForm()` unless `opts.form`). Absent values fail through `appendTextElement` (`SWHR-R-0042`).
3. `lib/b2b/partner/tpaInvoice.ts`: `buildPartnerInvoice` per `SWHR-R-0037` and `SWHR-R-0041`.
4. `lib/b2b/schemas/TPA{SupplierOrder,Invoice,LineItem}.{dtd,dtd.xsd,xsd}`: the partner XSDs carry the value ranges (`lineNo` ≥ 0, `quantity` ≥ 1, `unitPrice` ≥ 0) and `xs:unique` on item id. The DTD-form invoice has `locale` defaulting to `en_US` (R5).
5. `lib/b2b/partner/supplierOrderIntake.ts`: `intakeSupplierOrder` detects the TPA identifier or namespace, validates (switch `supplierOrder`; an invalid document raises `DocumentInvalidError`, which SWHR-T-0033 relies on for `SWHR-R-0047`), and maps to `SupplierOrder`. A `SupplierOrder` 1.1 document passes through `readSupplierOrder` unchanged.
6. `lib/b2b/partner/invoiceIntake.ts`: `readPartnerInvoice`, with the root and namespace check (`Invoice element expected.`), validation under the `invoice` switch (log and continue), and `OrderId` plus `itemId` → integer `quantity` extraction.

## File/module ownership

- `lib/b2b/partner/**` and tests (new)
- `lib/b2b/schemas/TPA{SupplierOrder,Invoice,LineItem}.{dtd,dtd.xsd,xsd}` (new)

## Definition of Done

- AC-1 … AC-15, in the ticket's order.
