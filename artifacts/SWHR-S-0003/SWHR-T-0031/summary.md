---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0003
ticket: SWHR-T-0031
branch: vortex/feat/SWHR-T-0031-partner-documents-tpa-supplier-order-inv-d7809c4f
upstream: [artifacts/SWHR-S-0003/SWHR-T-0031/PLAN.md]
downstream: [artifacts/SWHR-S-0003/qa-test-report.md]
---

# Summary — SWHR-T-0031: Partner documents — TPA supplier order, invoice, line item, schemas, intake

## What changed

Added the trading-partner document formats: `TPALineItem` (attribute-based, in its own namespace),
`buildPartnerSupplierOrder` and `buildPartnerInvoice` (both DTD- or XSD-declared per
`getSchemaForm()`), and their partner-schema files with value ranges and item-id uniqueness. Added
partner supplier-order intake (`intakeSupplierOrder`, detecting TPA vs internal `SupplierOrder` 1.1
and rejecting an invalid partner document per the SWHR-R-0047 SME ruling) and partner invoice
intake (`readPartnerInvoice`, root/namespace check then order id + shipped quantities).

## Files

- `lib/b2b/partner/tpaLineItem.ts` — attribute writer/reader for `LineItem` in the TPALineItem
  namespace (`categoryId`/`productId`/`itemId`/`lineNo`/`quantity`/`unitPrice`).
- `lib/b2b/partner/tpaSupplierOrder.ts` — `buildPartnerSupplierOrder`, `readShippingAddress`, the
  TPASupplierOrder namespace/public-id constants.
- `lib/b2b/partner/tpaInvoice.ts` — `buildPartnerInvoice`, `PartnerInvoice`, the TPAInvoice
  namespace/public-id constants.
- `lib/b2b/partner/supplierOrderIntake.ts` — `intakeSupplierOrder`.
- `lib/b2b/partner/invoiceIntake.ts` — `readPartnerInvoice`.
- `lib/b2b/partner/errors.ts` — `DocumentInvalidError`.
- `lib/b2b/schemas/files/TPA{SupplierOrder,Invoice,LineItem}.dtd` — served DTDs (not used for
  validation; DTD validation is unavailable under Bun, per design.md SD-2/P1).
- `lib/b2b/schemas/files/TPA{SupplierOrder,Invoice,LineItem}.dtd.xsd` — DTD-equivalent XSDs used to
  validate a DTD-form document.
- `lib/b2b/schemas/files/TPA{SupplierOrder,Invoice,LineItem}.xsd` — XSDs used to validate an
  XSD-form document. All six document-level schemas import `TPALineItem.{dtd.xsd,xsd}` and add an
  `xs:unique` constraint on `@itemId`.
- Tests: `lib/b2b/partner/{tpaLineItem,tpaSupplierOrder,tpaInvoice,supplierOrderIntake,
invoiceIntake}.test.ts`, `lib/b2b/schemas/partnerDocuments.dtd.xsd.test.ts`.

No files outside `lib/b2b/partner/**` and `lib/b2b/schemas/files/TPA*` were touched; the catalog
entries for these six files already existed from SWHR-T-0028/0029/0030.

## AC coverage

- AC-1/2 (Partner supplier order document) — `tpaSupplierOrder.ts` `buildPartnerSupplierOrder`;
  `[SWHR-C-0069]`, `[SWHR-C-0070]`.
- AC-3/4 (Partner supplier order intake) — `supplierOrderIntake.ts`; `[SWHR-C-0071]`,
  `[SWHR-C-0072]`.
- AC-5 (Partner invoice document) — `tpaInvoice.ts` `buildPartnerInvoice`; `[SWHR-C-0073]`.
- AC-6/7 (Partner invoice intake) — `invoiceIntake.ts`; `[SWHR-C-0074]`, `[SWHR-C-0075]`.
- AC-8/9 (Partner line item values) — `TPALineItem.{xsd,dtd.xsd}` (`positiveInteger`
  quantity, `nonNegativeDecimal` unitPrice); `[SWHR-C-0076]`, `[SWHR-C-0077]`.
- AC-10 (Unique item per partner document) — `xs:unique` in `TPASupplierOrder.{xsd,dtd.xsd}` /
  `TPAInvoice.{xsd,dtd.xsd}`; `[SWHR-C-0078]`.
- AC-11 (Partner document dates) — `formatDocumentDate` reused for `ShippingDate`;
  `[SWHR-C-0079]`.
- AC-12/13 (Required document values) — `appendTextElement`'s existing null/empty-string
  semantics; `[SWHR-C-0080]`, `[SWHR-C-0081]`.
- AC-14/15 (Configurable document validation) — `isValidationEnabled("invoice")` gate in
  `invoiceIntake.ts`; `getSchemaForm()` in both builders; `[SWHR-C-0083]`, `[SWHR-C-0084]`.

## Verification

```
$ bun --bun vitest run lib/b2b/partner lib/b2b/schemas/partnerDocuments.dtd.xsd.test.ts
Test Files  6 passed (6)
     Tests  33 passed (33)

$ bun run verify   # lint + typecheck + full unit suite
Test Files  67 passed (67)
     Tests  297 passed (297)
```

`bun run verify:full` was attempted; its E2E preflight reports Chromium is genuinely not installed
in this container and stops before running anything, per AGENTS.md's documented fallback — `bun run
verify` is the browser-free core gate in that case. This ticket adds no screens.

See `tdd-test-result.md` — `TDD-RESULT: 297 passed, 0 failed`, including the genuine red run
(stubs + removed schema files) preceding this green run.

## Notes

- **No wrapping `LineItems` element.** SWHR-C-0073's expected child list (`[OrderId, UserId,
OrderDate, ShippingDate, LineItem, LineItem]`) shows `LineItem` elements direct children of the
  root, not inside a wrapper — `buildPartnerSupplierOrder`/`buildPartnerInvoice` append `LineItem`
  directly, matching the legacy TPA DTDs. `PLAN.md`'s prose ("`LineItems` holding one or more line
  items") reads this as a plural concept, not a literal element; recorded here since it is a minor
  deviation from a literal reading of design.md's requirement prose, not from `PLAN.md`'s fixed
  interface contracts.
- **DTD-equivalent XSDs carry the same value-range/uniqueness constraints as their XSD-form
  counterparts** (P1's "DTD-equivalent" read as "same validation strength," since the ACs test
  "the partner schema" generically without naming a form). `TPAInvoice.dtd.xsd` additionally
  declares the optional `locale` attribute (absent from `TPAInvoice.xsd`, R5) so a DTD-form invoice
  — which does carry that attribute — validates without an "unexpected attribute" error.
- `intakeSupplierOrder`/`readPartnerInvoice` prefer a declared DOCTYPE's public identifier as the
  validation schema key over the namespace when both are present (a DTD-form document carries
  both), so a DTD-form partner document is checked against its `.dtd.xsd` equivalent rather than
  the plain `.xsd`.
