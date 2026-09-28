---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0003
ticket: SWHR-T-0032
branch: vortex/feat/SWHR-T-0032-version-1-0-purchase-order-intake-read-t-f5cba4e8
upstream: [artifacts/SWHR-S-0003/SWHR-T-0032/PLAN.md]
downstream: [artifacts/SWHR-S-0003/qa-test-report.md]
---

# Summary — SWHR-T-0032: Version 1.0 purchase order intake

## What changed

Added `readPurchaseOrderV1`, reading a legacy version 1.0 purchase order into the same
`PurchaseOrder` shape `readPurchaseOrder` (SWHR-T-0030) produces, plus the reconstructed 1.0 DTD and
its DTD-equivalent XSD. No writer is added — this ticket is read-only intake per the interface
contract and PLAN.md.

## Files

- `lib/b2b/documents/purchaseOrderV1.ts` — `PURCHASE_ORDER_V1_PUBLIC_ID`, `readPurchaseOrderV1`; a
  private `readV1Address` maps a `ShipToAddress`/`BillToAddress` wrapper into a `ContactInfo` with
  empty email/phone.
- `lib/b2b/documents/purchaseOrderV1.test.ts` — the approved case plus 3 supporting tests.
- `lib/b2b/schemas/files/PurchaseOrder-1.0.dtd` — reconstructed 1.0 DTD (header comment marks it as
  such), reusing `CreditCard.dtd`/`LineItem.dtd` via parameter entities.
- `lib/b2b/schemas/files/PurchaseOrder-1.0.dtd.xsd` — its DTD-equivalent XSD, `xs:include`-ing
  `CreditCard.dtd.xsd`/`LineItem.dtd.xsd`.

## AC coverage

- AC-1 (Version 1.0 purchase order received) — `purchaseOrderV1.test.ts › [SWHR-C-0098]`.

## Verification

```
$ bun run verify
lint ✓  typecheck ✓
Test Files  62 passed (62)
     Tests  268 passed (268)
$ bun run verify:full
... E2E preflight: Chromium not installed in this container — expected per AGENTS.md,
    fell back to `verify` (no UI in this ticket to exercise anyway).
```

See `tdd-test-result.md` — `TDD-RESULT: 268 passed, 0 failed`.

## Notes

- **Ship-to/bill-to wrapper names are a reconstruction (design.md SD-6, confidence: low).** No 1.0
  DTD exists in this repository; PLAN.md specifies TPA-style `FirstName`/`LastName`/`Street`/`City`/
  `State`/`Country`/`ZipCode` address children, but doesn't name the wrapper elements themselves. Used
  `ShipToAddress`/`BillToAddress`, matching SWHR-R-0052's own "ship-to and bill-to addresses" wording.
  This is exactly the confidence-low reconstruction design.md already flags; retaining the 1.0 format
  at all awaits ruling Q1 in SWHR-T-0035, and tasks.md 6.1 (the ruling itself) is that ticket's job,
  not this one's — nothing to build for it here, per PLAN.md step 3.
- **Credit card and line items reuse the 1.1 readers unchanged** (`readCreditCard`, `readLineItem`
  from SWHR-T-0029) — PLAN.md step 2's "the 1.1 names for everything else".
- **Schema files placed under `lib/b2b/schemas/files/`**, matching the existing `SCHEMAS_DIR` in
  `lib/b2b/xml/validate.ts` and the schema route (SWHR-T-0028), and the same precedent set in
  SWHR-T-0029/SWHR-T-0030 for schema file placement.
- No deviation from `PLAN.md` requiring a contract or ownership change; no blockers encountered.
