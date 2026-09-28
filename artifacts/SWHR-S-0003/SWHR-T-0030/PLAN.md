---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0003
ticket: SWHR-T-0030
idea: SWHR-I-0004
branch: Not Provided
upstream:
  [
    openspec/changes/swhr-i-0004-partner-document-exchange/design.md,
    openspec/changes/swhr-i-0004-partner-document-exchange/specs/b2b-document-exchange/spec.md,
  ]
---

# PLAN — SWHR-T-0030 · Order documents

Change `swhr-i-0004-partner-document-exchange` · tasks.md group 3. Read `openspec/changes/swhr-i-0004-partner-document-exchange/design.md` first: §Planning (findings, P1–P9, SD-1–SD-9) and §Interface contracts. Each approved test case in `openspec/changes/swhr-i-0004-partner-document-exchange/test-cases.md` for your scenarios becomes a test whose name carries its `SWHR-C-*` id (SD-8).

## Objective

`PurchaseOrder` 1.1 and the internal `SupplierOrder` 1.1 write and read per `SWHR-R-0024`–`SWHR-R-0026` and `SWHR-R-0033`–`SWHR-R-0034`, validated by default, with the document-type check, logged schema violations and UTF-8 output.

## Steps

1. `lib/b2b/documents/purchaseOrder.ts`: the writer emits the `locale` attribute and the element order of `SWHR-R-0024`, with the PurchaseOrder 1.1 DOCTYPE. The reader runs, in order: parse → `checkDocumentType` (when validation is on) → validate when `opts.validate ?? isValidationEnabled("purchaseOrder")`, logging each error through `opts.log` and continuing (SD-9) → `expectRoot("PurchaseOrder")` → read children, defaulting `locale` to `en_US` and a bad or missing `OrderDate` to `opts.now()` (design.md P3).
2. `lib/b2b/documents/supplierOrder.ts`: the same pattern for `SupplierOrder` 1.1 (root check, date fallback). Its default validation switch is `supplierOrder`. Rejection of an invalid supplier order is SWHR-T-0033's job; this reader reports and logs.
3. `lib/b2b/schemas/{PurchaseOrder,SupplierOrder}.dtd` and their `.dtd.xsd` equivalents. They include the element schemas and require at least one `LineItem`.

## File/module ownership

- `lib/b2b/documents/purchaseOrder.ts`, `lib/b2b/documents/supplierOrder.ts` and their tests (new)
- `lib/b2b/schemas/{PurchaseOrder,SupplierOrder}.{dtd,dtd.xsd}` (new)

## Definition of Done

- AC-1 … AC-13, in the ticket's order. AC-11 to AC-13 are proven through `readPurchaseOrder`.
