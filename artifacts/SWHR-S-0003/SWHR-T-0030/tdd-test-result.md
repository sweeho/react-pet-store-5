---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0003
ticket: SWHR-T-0030
branch: vortex/feat/SWHR-T-0030-order-documents-purchaseorder-1-1-and-in-95ac9099
upstream: [artifacts/SWHR-S-0003/SWHR-T-0030/PLAN.md]
---

# TDD result — SWHR-T-0030

## Test cases

| Test                                                                                                                              | Covers                                                      | Intent                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `lib/b2b/documents/purchaseOrder.test.ts › [SWHR-C-0047] writes children in schema order for two line items`                      | AC-1 (SWHR-R-0024.01)                                       | writer emits the 9-element PurchaseOrder child order                              |
| `lib/b2b/documents/purchaseOrder.test.ts › [SWHR-C-0048] reads a document with no locale attribute as en_US`                      | AC-2 (SWHR-R-0024.02)                                       | absent `locale` defaults to `en_US`                                               |
| `lib/b2b/documents/purchaseOrder.test.ts › [SWHR-C-0049] reports a purchase order with no LineItem as invalid`                    | AC-3 (SWHR-R-0024.03)                                       | zero-LineItem document fails XSD validation                                       |
| `lib/b2b/documents/purchaseOrder.test.ts › [SWHR-C-0050] rejects a SupplierOrder document read as a purchase order`               | AC-4 (SWHR-R-0025.01)                                       | wrong root → `PurchaseOrder element expected.`, no order returned                 |
| `lib/b2b/documents/purchaseOrder.test.ts › [SWHR-C-0051] writes OrderDate as 2002-03-15 with no time component`                   | AC-5 (SWHR-R-0026.01)                                       | `OrderDate` drops time of day                                                     |
| `lib/b2b/documents/purchaseOrder.test.ts › [SWHR-C-0052] falls back to the current date for an unparseable OrderDate…`            | AC-6 (SWHR-R-0026.02)                                       | bad `OrderDate` → injected `now()`, reading continues                             |
| `lib/b2b/documents/supplierOrder.test.ts › [SWHR-C-0066] rejects a PurchaseOrder document read as a supplier order`               | AC-7 (SWHR-R-0033.01)                                       | wrong root → `SupplierOrder element expected.`                                    |
| `lib/b2b/documents/supplierOrder.test.ts › [SWHR-C-0067] writes children in schema order for three line items`                    | AC-8 (SWHR-R-0033.02)                                       | writer emits the 6-element SupplierOrder child order                              |
| `lib/b2b/documents/supplierOrder.test.ts › [SWHR-C-0068] falls back to the current date for OrderDate 'not-a-date'…`              | AC-9 (SWHR-R-0034.01)                                       | bad `OrderDate` → injected `now()`, reading continues                             |
| `lib/b2b/documents/purchaseOrder.test.ts › [SWHR-C-0082] encodes a non-ASCII family name as UTF-8`                                | AC-10 (SWHR-R-0043.01)                                      | `encoding="UTF-8"` declared, `Müller` round-trips as UTF-8 bytes                  |
| `lib/b2b/documents/purchaseOrder.test.ts › [SWHR-C-0085] rejects a document declaring the SupplierOrder 1.1 type`                 | AC-11 (SWHR-R-0045.01), via `readPurchaseOrder` per PLAN.md | mismatched DOCTYPE public id → `Document not of type`                             |
| `lib/b2b/documents/purchaseOrder.test.ts › [SWHR-C-0086] passes the document type check for a document with no DOCTYPE`           | AC-12 (SWHR-R-0045.02), via `readPurchaseOrder`             | no DOCTYPE → check passes, order still read                                       |
| `lib/b2b/documents/purchaseOrder.test.ts › [SWHR-C-0088] logs a violation mentioning TotalPrice and continues when it is missing` | AC-13 (SWHR-R-0046.02), via `readPurchaseOrder`             | schema violation logged via `opts.log`, reading returns a result without throwing |

Supporting coverage (round-trip tests, the validation-switch tests, and the malformed-XML tests) lives
in `purchaseOrder.test.ts` / `supplierOrder.test.ts` alongside the rows above — no separate approved
case id exists for these, since they exercise the reader/writer as a whole rather than a numbered spec
scenario.

## Red run

`NODE_ENV=test bun --bun vitest run lib/b2b/documents`, with `lib/b2b/documents/purchaseOrder.ts` and
`supplierOrder.ts` swapped for stubs throwing the configured stub sentinel (types/exports kept, so only
behaviour — not imports — was missing):

```
Test Files  2 failed (2)
     Tests  17 failed | 2 passed (19)
```

The 2 passes are both the generic `"throws MalformedDocumentError for an unclosed element"` cases,
which assert only `.rejects.toThrow()` with no message — the stub's sentinel throw
satisfies that bare assertion too. Not a false red: the other 17 cases assert specific messages/values
the stub cannot produce, and all 17 failed as expected.

## Green run

`bun run verify` — this stack's full pre-commit gate (lint + typecheck + the complete unit/integration
suite), with the real implementation restored:

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(clean)
$ tsc --build
(clean)
$ NODE_ENV=test bun --bun vitest run
 Test Files  61 passed (61)
      Tests  264 passed (264)
```

`bun run verify:full`'s E2E tier was attempted; its preflight reported Chromium is not installed in
this container (`/ms-playwright/chromium-1155/chrome-linux/chrome` missing) — per AGENTS.md this means
fall back to `verify` rather than retry or install a browser. This ticket has no UI.

TDD-RESULT: 264 passed, 0 failed
