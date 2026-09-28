---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0003
ticket: SWHR-T-0030
branch: vortex/feat/SWHR-T-0030-order-documents-purchaseorder-1-1-and-in-95ac9099
upstream: [artifacts/SWHR-S-0003/SWHR-T-0030/PLAN.md]
downstream: [artifacts/SWHR-S-0003/qa-test-report.md]
---

# Summary — SWHR-T-0030: Order documents — PurchaseOrder 1.1 and internal SupplierOrder 1.1 writers, readers, dates and schemas

## What changed

Added `writePurchaseOrder`/`readPurchaseOrder` and `writeSupplierOrder`/`readSupplierOrder` on top of
the SWHR-T-0028 XML infrastructure and the SWHR-T-0029 shared elements, plus their bundled
DTD/DTD-equivalent-XSD schema files. Both readers run the same pipeline: parse → (when validation is
on) document-type check then XSD validation, logging violations and continuing → the unconditional
root-element check → positional child reads, with `locale` defaulting to `en_US` and `OrderDate`
defaulting to the injectable clock on a missing/unparseable date.

## Files

- `lib/b2b/documents/purchaseOrder.ts` — `PurchaseOrder`, `ReadOptions`, `writePurchaseOrder`, `readPurchaseOrder`.
- `lib/b2b/documents/purchaseOrder.test.ts` — the 10 PurchaseOrder-side approved cases plus round-trip/validation-switch coverage.
- `lib/b2b/documents/supplierOrder.ts` — `SupplierOrder`, `writeSupplierOrder`, `readSupplierOrder` (imports `ReadOptions` from `purchaseOrder.ts`, the only shared-file-ownership boundary between the two).
- `lib/b2b/documents/supplierOrder.test.ts` — the 3 SupplierOrder-side approved cases plus round-trip coverage.
- `lib/b2b/schemas/files/PurchaseOrder.dtd`, `PurchaseOrder.dtd.xsd`, `SupplierOrder.dtd`, `SupplierOrder.dtd.xsd` — bundled schemas, `ShippingInfo`/`BillingInfo` each wrapping one `ContactInfo`, `LineItem` required at least once; the `.dtd.xsd` files `xs:include` the SWHR-T-0029 element schemas and are what `validateDocument` actually validates against (`lib/b2b/schemas/catalog.ts` already named these filenames).
- `routes/api/b2b/schemas/[file].test.ts` — fixed (see Notes): no longer uses a real catalog filename as a scratch fixture.

## AC coverage

- AC-1…AC-13 (ticket order) — one row each in `tdd-test-result.md`'s `## Test cases`, naming the exact
  test and the requirement/scenario it proves. AC-11–AC-13 are proven through `readPurchaseOrder`
  itself per `PLAN.md`, not through the lower-level `checkDocumentType`/`validateDocument` units
  SWHR-T-0028 already covers.

## Verification

```
$ bun run verify
lint ✓  typecheck ✓
Test Files  61 passed (61)
     Tests  264 passed (264)
$ bun run verify:full
... E2E preflight: Chromium not installed in this container — expected per AGENTS.md,
    fell back to `verify` (no UI in this ticket to exercise anyway).
```

See `tdd-test-result.md` — `TDD-RESULT: 264 passed, 0 failed`.

## Notes

- **Fixed a pre-existing test-isolation bug in `routes/api/b2b/schemas/[file].test.ts`** (SWHR-T-0028,
  outside this ticket's file ownership, but it broke the shared `bun run verify` gate the moment this
  ticket landed a real file at the filename it used as a scratch fixture). That test wrote/deleted
  `lib/b2b/schemas/files/PurchaseOrder.dtd.xsd` — a real catalog filename — assuming no schema ticket
  had populated it yet; running the full suite after this ticket's schema files landed deleted the real
  file via the test's `afterEach`. Fixed by `vi.mock`-ing the catalog module with a fixture identifier
  local to the test, so it no longer touches any real bundled schema regardless of which later tickets
  (T-0031, T-0032) populate the remaining catalog-listed files. Verified the real `.xsd` files survive
  a full `bun run verify` run after the fix.
- **Lenient top-level reads are scoped narrowly.** Only `OrderDate`, `TotalPrice` (PurchaseOrder) and
  `LineItem`'s cardinality use `optionalText`/no-minimum reads, because those are the only
  fields with an explicit "missing or unparseable → tolerate" requirement (SWHR-R-0026/0034,
  SWHR-R-0046.02) or an explicit "reported invalid via validation, not reader rejection"
  requirement (SWHR-R-0024.03). `OrderId`/`UserId`/`EmailId`/`ShippingInfo`/`BillingInfo`/`CreditCard`
  stay strict (`reader.text`/`reader.element`, which throw on a missing/out-of-order element) — no
  acceptance criterion asks for tolerance there, and inventing placeholder defaults for a whole missing
  contact/credit-card object isn't something any scenario exercises.
- **PurchaseOrder/SupplierOrder are always DOCTYPE-declared** (no XSD-form toggle) — `SWHR-R-0044`'s
  DTD-vs-XSD form choice applies to the partner (TPA) documents `SWHR-T-0031` builds, not to these two
  internal document types.
