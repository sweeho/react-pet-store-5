---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0003
ticket: SWHR-T-0029
branch: vortex/feat/SWHR-T-0029-shared-document-elements-contactinfo-add-7fe3fc55
upstream: [artifacts/SWHR-S-0003/SWHR-T-0029/PLAN.md]
downstream: [artifacts/SWHR-S-0003/qa-test-report.md]
---

# Summary — SWHR-T-0029: Shared document elements — ContactInfo, Address, CreditCard, LineItem

## What changed

Added the four reusable `lib/b2b/elements/*` modules (`writeX`/`readX` pairs built on SWHR-T-0028's
`ChildReader`/`expectRoot`/`appendTextElement`), plus the bundled 1.1 DTDs and DTD-equivalent XSDs for
each, under `lib/b2b/schemas/files/` (the directory `lib/b2b/xml/validate.ts` and the schema route
already resolve against — the catalog entries for these four identifiers were already in place from
SWHR-T-0028, pointing at these exact filenames).

## Files

- `lib/b2b/elements/address.ts` — `Address`, `writeAddress`, `readAddress` (SWHR-R-0028/0029).
- `lib/b2b/elements/contactInfo.ts` — `ContactInfo`, `writeContactInfo`, `readContactInfo` (SWHR-R-0027).
- `lib/b2b/elements/creditCard.ts` — `CreditCard`, `writeCreditCard`, `readCreditCard` (SWHR-R-0030).
- `lib/b2b/elements/lineItem.ts` — `LineItem`, `StoredLineItem`, `writeLineItem`, `readLineItem`, `toExportLineItem` (SWHR-R-0031/0032).
- `lib/b2b/schemas/files/{Address,ContactInfo,CreditCard,LineItem}.dtd` — the bundled 1.1 DTDs (ContactInfo's `%Address;` parameter entity includes Address.dtd, mirroring the nesting).
- `lib/b2b/schemas/files/{Address,ContactInfo,CreditCard,LineItem}.dtd.xsd` — DTD-equivalent XSDs (design.md P1); ContactInfo's includes Address's via `xs:include`.
- One `*.test.ts` per element module, plus `lib/b2b/schemas/elements.dtd.xsd.test.ts` (schema round-trip/violation coverage).

## AC coverage

- AC-1..AC-3 (ContactInfo) — `contactInfo.test.ts › [SWHR-C-0053..0055]`.
- AC-4..AC-5 (Address output) — `address.test.ts › [SWHR-C-0056..0057]`.
- AC-6..AC-8 (Address input) — `address.test.ts › [SWHR-C-0058..0060]`.
- AC-9..AC-10 (CreditCard) — `creditCard.test.ts › [SWHR-C-0061..0062]`.
- AC-11..AC-12 (LineItem) — `lineItem.test.ts › [SWHR-C-0063..0064]`.
- AC-13 (export excludes shipped quantity) — `lineItem.test.ts › [SWHR-C-0065]`.

## Verification

```
$ bun run verify
lint ✓  typecheck ✓
Test Files  59 passed (59)
     Tests  245 passed (245)
$ bun run verify:full
... E2E preflight: Chromium not installed in this container — expected per AGENTS.md,
    fell back to `verify` (no UI in this ticket to exercise anyway).
```

See `tdd-test-result.md` — `TDD-RESULT: 245 passed, 0 failed`.

## Notes

- **`expectRoot` reused for every element's "wrong node" rejection.** `expectRoot(el, "ContactInfo")` /
  `"Address"` / `"CreditCard"` / `"LineItem"` already throws exactly `${name} element expected.`
  (SWHR-T-0028), so no element module writes its own root-name check.
- **Address's second `StreetName` on read.** `ChildReader.optionalText` doesn't check emptiness, so a
  present-but-empty second `StreetName` (SWHR-R-0029.03) is caught with an explicit `streetName2 === ""`
  check right after the `optionalText` call, distinguishing "absent" (`null`) from "present but empty"
  (`""`).
- **LineItem's `Quantity`/`UnitPrice` validation is regex-based on the raw text**, not `Number.isInteger`
  on the parsed value — this rejects a value like `"5.0"` for `Quantity` that `Number()` would silently
  accept as integer 5, matching "MUST reject a Quantity that is not an integer" at the text level.
- **Schema files live under `lib/b2b/schemas/files/`**, not directly under `lib/b2b/schemas/`, to match
  `SCHEMAS_DIR` in `lib/b2b/xml/validate.ts` and `routes/api/b2b/schemas/[file].get.ts` (both already
  committed in SWHR-T-0028) — the ticket description's shorthand path omits the `files/` segment those
  fixed consumers require.
- No deviation from `PLAN.md` requiring a contract or ownership change; no blockers encountered.
