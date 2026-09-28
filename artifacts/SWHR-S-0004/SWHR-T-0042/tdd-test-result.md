---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0004
ticket: SWHR-T-0042
branch: vortex/feat/SWHR-T-0042-data-model-credential-session-role-custo-0827349d
upstream: [artifacts/SWHR-S-0004/SWHR-T-0042/PLAN.md]
---

# TDD result — SWHR-T-0042

## Test cases

| Test                                                                                                                                             | Covers                | Intent                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `lib/b2b/exchange/supplierOrders.test.ts › getSupplierOrder › [SWHR-C-0131] returns the order with no role or session argument in its signature` | AC-1 (SWHR-R-0071.01) | `getSupplierOrder` reads a seeded order with no role/session parameter in its signature and no authorisation error. |
| `lib/b2b/exchange/supplierOrders.test.ts › getSupplierOrder › returns null for an order that does not exist`                                     | supporting            | data-layer null case, no exception.                                                                                 |
| `lib/b2b/exchange/supplierOrders.test.ts › listSupplierOrders › returns every persisted supplier order`                                          | supporting            | the second contracted export, same no-check property.                                                               |

`lib/locale/preference.test.ts` is a pre-existing suite (SWHR-I-0003), adapted in place for the `userId: string` signature change (P1) — not a new case, unaffected in behaviour, and re-verified in the green run below.

## Red run

`NODE_ENV=test bun --bun vitest run lib/b2b/exchange/supplierOrders.test.ts`, with `getSupplierOrder`/`listSupplierOrders` stubbed to `throw new Error("VortexNotImplemented")`:

```
 ❯ |server| lib/b2b/exchange/supplierOrders.test.ts (3 tests | 3 failed) 6ms
     × [SWHR-C-0131] returns the order with no role or session argument in its signature
     × returns null for an order that does not exist
     × returns every persisted supplier order
Error: VortexNotImplemented
 ❯ getSupplierOrder lib/b2b/exchange/supplierOrders.ts:20:3

 Test Files  1 failed (1)
      Tests  3 failed (3)
```

## Green run

`bun run verify` (this stack's full gate — lint + typecheck + the complete Vitest suite):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  74 passed (74)
      Tests  325 passed (325)
```

`bun run verify:full`'s E2E tier could not run in this container: `scripts/ensure-playwright-browser.mjs` reports Chromium is not installed at the expected path. Per AGENTS.md this is not retried here — E2E runs in the QA phase / CI. Manual verification of the seeding/migration behaviour that E2E would otherwise exercise is recorded in `summary.md`.

TDD-RESULT: 325 passed, 0 failed
