---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0003
ticket: SWHR-T-0032
branch: vortex/feat/SWHR-T-0032-version-1-0-purchase-order-intake-read-t-f5cba4e8
upstream: [artifacts/SWHR-S-0003/SWHR-T-0032/PLAN.md]
---

# TDD result — SWHR-T-0032

## Test cases

| Test                                                                                                                                  | Covers                | Intent                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| `lib/b2b/documents/purchaseOrderV1.test.ts › [SWHR-C-0098] reads a version 1.0 purchase order with two line items and default locale` | AC-1 (SWHR-R-0052.01) | ship-to/bill-to addresses, card and both line items read correctly; locale is `en_US` |

Three supporting tests in the same file exercise behaviour this ticket introduces but that has no
approved case id: an explicit `locale` attribute is honoured when present, a node that is not
`PurchaseOrder` is rejected with `PurchaseOrder element expected.` (reusing `expectRoot` from
SWHR-T-0028), and a missing `OrderDate` falls back to the injected clock (reusing `parseDocumentDate`
from SWHR-T-0028, the same tolerance `readPurchaseOrder` already has).

## Red run

`NODE_ENV=test bun --bun vitest run lib/b2b/documents/purchaseOrderV1.test.ts`, with
`purchaseOrderV1.ts` swapped for a stub throwing `VortexNotImplemented` (the exported
`PURCHASE_ORDER_V1_PUBLIC_ID` constant and `readPurchaseOrderV1`'s signature kept intact so only
behaviour, not imports or types, was missing):

```
Test Files  1 failed (1)
     Tests  4 failed (4)
```

All 4 tests failed — 3 on the `VortexNotImplemented` throw directly, and the "rejects a node that is
not a PurchaseOrder element" test on an assertion mismatch (expected message `PurchaseOrder element
expected.`, got `VortexNotImplemented`) — reproduced on this run (a single execution; no flake
observed).

## Green run

`bun run verify` — this stack's full pre-commit gate (lint + typecheck + the complete unit/integration
suite), with the real implementation restored:

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(clean)
$ tsc --build
(clean)
$ NODE_ENV=test bun --bun vitest run
 Test Files  62 passed (62)
      Tests  268 passed (268)
```

268 = the 264-test baseline on this branch (confirmed via `git stash` before writing this ticket's
files) plus this ticket's 4 new tests — zero new failures, zero regressions.

`bun run test:e2e` was attempted and its preflight reported Chromium is not installed in this
container (`/ms-playwright/chromium-1155/chrome-linux/chrome` missing) — per AGENTS.md this means
fall back to `verify` rather than retry or install a browser. This ticket has no UI, so the E2E tier
would not have exercised anything it touches; Validation's E2E run at integration QA covers the
existing storefront regression suite unchanged.

TDD-RESULT: 268 passed, 0 failed
