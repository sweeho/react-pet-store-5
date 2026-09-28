---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0003
ticket: SWHR-T-0031
branch: vortex/feat/SWHR-T-0031-partner-documents-tpa-supplier-order-inv-d7809c4f
upstream: [artifacts/SWHR-S-0003/SWHR-T-0031/PLAN.md]
---

# TDD result — SWHR-T-0031

## Test cases

| Test                                                               | Covers                 | Intent                                                                          |
| ------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------- |
| `lib/b2b/partner/tpaSupplierOrder.test.ts › [SWHR-C-0069]`         | AC-1 (SWHR-R-0035.01)  | partner order carries id, date, nine address fields, two line items             |
| `lib/b2b/partner/tpaSupplierOrder.test.ts › [SWHR-C-0070]`         | AC-2 (SWHR-R-0035.02)  | only the first street line is transmitted                                       |
| `lib/b2b/partner/supplierOrderIntake.test.ts › [SWHR-C-0071]`      | AC-3 (SWHR-R-0036.01)  | partner-format order converts to an equal internal supplier order               |
| `lib/b2b/partner/supplierOrderIntake.test.ts › [SWHR-C-0072]`      | AC-4 (SWHR-R-0036.02)  | internal SupplierOrder 1.1 document processed unchanged                         |
| `lib/b2b/partner/tpaInvoice.test.ts › [SWHR-C-0073]`               | AC-5 (SWHR-R-0037.01)  | invoice children in order: OrderId, UserId, OrderDate, ShippingDate, LineItem×2 |
| `lib/b2b/partner/invoiceIntake.test.ts › [SWHR-C-0074]`            | AC-6 (SWHR-R-0038.01)  | valid invoice yields order id and shipped quantities                            |
| `lib/b2b/partner/invoiceIntake.test.ts › [SWHR-C-0075]`            | AC-7 (SWHR-R-0038.02)  | SupplierOrder document on the invoice channel is rejected                       |
| `lib/b2b/schemas/partnerDocuments.dtd.xsd.test.ts › [SWHR-C-0076]` | AC-8 (SWHR-R-0039.01)  | unit price 0.0 passes schema validation                                         |
| `lib/b2b/schemas/partnerDocuments.dtd.xsd.test.ts › [SWHR-C-0077]` | AC-9 (SWHR-R-0039.02)  | quantity 0 fails schema validation                                              |
| `lib/b2b/schemas/partnerDocuments.dtd.xsd.test.ts › [SWHR-C-0078]` | AC-10 (SWHR-R-0040.01) | duplicate item id fails validation (xs:unique)                                  |
| `lib/b2b/partner/tpaInvoice.test.ts › [SWHR-C-0079]`               | AC-11 (SWHR-R-0041.01) | ShippingDate written as a calendar date only                                    |
| `lib/b2b/partner/tpaInvoice.test.ts › [SWHR-C-0080]`               | AC-12 (SWHR-R-0042.01) | building without a user id fails naming UserId                                  |
| `lib/b2b/partner/tpaSupplierOrder.test.ts › [SWHR-C-0081]`         | AC-13 (SWHR-R-0042.02) | empty phone number still writes an empty Phone element                          |
| `lib/b2b/partner/invoiceIntake.test.ts › [SWHR-C-0083]`            | AC-14 (SWHR-R-0044.01) | invoice validation off: only the purchase order is validated                    |
| `lib/b2b/schemas/partnerDocuments.dtd.xsd.test.ts › [SWHR-C-0084]` | AC-15 (SWHR-R-0044.02) | XSD form: no DOCTYPE, validated against the partner XML Schema                  |

Plus supporting unit tests in `tpaLineItem.test.ts`, and switch/pass-through/error-path coverage in
`supplierOrderIntake.test.ts` / `invoiceIntake.test.ts` / `tpaSupplierOrder.test.ts` /
`tpaInvoice.test.ts` (DocumentInvalidError, validation-disabled path, DTD/XSD doctype presence).

## Red run

`bun --bun vitest run lib/b2b/partner lib/b2b/schemas/partnerDocuments.dtd.xsd.test.ts`, run against
the six new test files with every `lib/b2b/partner/*.ts` source file and all nine
`lib/b2b/schemas/files/TPA*` schema files replaced with `throw new Error("VortexNotImplemented")`
stubs (schema files removed):

```
FAIL  lib/b2b/schemas/partnerDocuments.dtd.xsd.test.ts > ... [SWHR-C-0084] ...
Error: VortexNotImplemented
 ❯ buildPartnerSupplierOrder lib/b2b/partner/tpaSupplierOrder.ts:17:3

 Test Files  6 failed (6)
      Tests  33 failed (33)
```

All 33 tests failed. Implementation and schema files were then restored from backup.

## Green run

`bun run verify` (this stack's full gate — lint, typecheck, and the complete unit test suite):

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  67 passed (67)
      Tests  297 passed (297)
```

`bun run verify:full` (verify + E2E) was also attempted; its `pretest:e2e` preflight reported
Chromium is not installed in this container (`/ms-playwright/chromium-1155/chrome-linux/chrome`
missing) and stopped without running any test — the documented AGENTS.md fallback ("Prefer this
[verify-full]... `verify` alone is the browser-free core gate — the right fallback only when the
E2E preflight tells you the browser is genuinely missing"). This ticket adds no screens, and the
storefront E2E suite is unaffected by it; validation's E2E run at INTEGRATION_QA covers it.

TDD-RESULT: 297 passed, 0 failed
