---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0003
ticket: SWHR-T-0032
idea: SWHR-I-0004
branch: Not Provided
upstream:
  [
    openspec/changes/swhr-i-0004-partner-document-exchange/design.md,
    openspec/changes/swhr-i-0004-partner-document-exchange/specs/b2b-document-exchange/spec.md,
  ]
---

# PLAN — SWHR-T-0032 · Version 1.0 purchase order intake

Change `swhr-i-0004-partner-document-exchange` · tasks.md group 6. Read `openspec/changes/swhr-i-0004-partner-document-exchange/design.md` first: §Planning (findings, P1–P9, SD-1–SD-9) and §Interface contracts. Each approved test case in `openspec/changes/swhr-i-0004-partner-document-exchange/test-cases.md` for your scenarios becomes a test whose name carries its `SWHR-C-*` id (SD-8).

## Objective

A version 1.0 purchase order is read into the same `PurchaseOrder` shape, with its locale defaulting to `en_US` (`SWHR-R-0052`). The format is retained pending ruling Q1 (SWHR-T-0035).

## Steps

1. `lib/b2b/schemas/PurchaseOrder-1.0.{dtd,dtd.xsd}`. The 1.0 element names are not recoverable (design.md SD-6): use the fields `SWHR-R-0052` lists, with ship-to and bill-to addresses named like the TPA `ShippingAddress` children (`FirstName`, `LastName`, `Street`, `City`, `State`, `Country`, `ZipCode`), and the 1.1 names for everything else. Put a header comment in the DTD saying it is a reconstruction.
2. `lib/b2b/documents/purchaseOrderV1.ts`: `readPurchaseOrderV1`, reusing the 1.1 element readers where the shapes match and `ChildReader` otherwise. It maps 1.0 names into `ContactInfo` (email and phone empty where 1.0 has none).
3. tasks.md 6.1 (rulings) is covered by SWHR-T-0035. Nothing to build for it.

## File/module ownership

- `lib/b2b/documents/purchaseOrderV1.ts` + test (new)
- `lib/b2b/schemas/PurchaseOrder-1.0.{dtd,dtd.xsd}` (new)

## Definition of Done

- AC-1 (`Legacy version 1.0 document formats — Version 1.0 purchase order received`)
