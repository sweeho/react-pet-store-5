---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0003
ticket: SWHR-T-0029
idea: SWHR-I-0004
branch: Not Provided
upstream:
  [
    openspec/changes/swhr-i-0004-partner-document-exchange/design.md,
    openspec/changes/swhr-i-0004-partner-document-exchange/specs/b2b-document-exchange/spec.md,
  ]
---

# PLAN — SWHR-T-0029 · Shared document elements

Change `swhr-i-0004-partner-document-exchange` · tasks.md group 2. Read `openspec/changes/swhr-i-0004-partner-document-exchange/design.md` first: §Planning (findings, P1–P9, SD-1–SD-9) and §Interface contracts. Each approved test case in `openspec/changes/swhr-i-0004-partner-document-exchange/test-cases.md` for your scenarios becomes a test whose name carries its `SWHR-C-*` id (SD-8).

## Objective

The four reusable elements (ContactInfo, Address, CreditCard, LineItem) write and read per `SWHR-R-0027`–`SWHR-R-0032`, with their 1.1 DTDs and DTD-equivalent XSDs bundled.

## Steps

1. `lib/b2b/elements/contactInfo.ts`: `writeContactInfo`/`readContactInfo`, strict order via `ChildReader`, empty `Email` allowed and empty `FamilyName`/`GivenName`/`Phone` rejected.
2. `lib/b2b/elements/address.ts`: writer with a conditional second `StreetName` and empty elements for absent values (`SWHR-R-0028`). The reader requires non-empty `City`, `State`, `ZipCode` and `Country` (Q3: built as required), and rejects a present-but-empty second `StreetName`.
3. `lib/b2b/elements/creditCard.ts`, per `SWHR-R-0030`.
4. `lib/b2b/elements/lineItem.ts`: integer `Quantity` (reject non-integers) and decimal-string `UnitPrice` (reject non-decimals; design.md P2). `toExportLineItem` drops `quantityShipped`.
5. `lib/b2b/schemas/{ContactInfo,Address,CreditCard,LineItem}.dtd` and a `.dtd.xsd` equivalent for each (design.md P1), under the file names `catalog.ts` already maps. Address's DTD keeps `Country?`, as the legacy DTD had (R1); the reader enforces the stricter rule.

## File/module ownership

- `lib/b2b/elements/**` and tests (new)
- `lib/b2b/schemas/{ContactInfo,Address,CreditCard,LineItem}.{dtd,dtd.xsd}` (new)

## Definition of Done

- AC-1 … AC-13, one per scenario of `SWHR-R-0027` to `SWHR-R-0032`, in the ticket's order.
