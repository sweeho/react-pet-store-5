---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0003
ticket: SWHR-T-0033
branch: vortex/feat/SWHR-T-0033-asynchronous-exchange-sqlite-outbox-and-2c44b43a
upstream: [artifacts/SWHR-S-0003/SWHR-T-0033/PLAN.md]
---

# TDD result — SWHR-T-0033

## Test cases

| Test                                                                                                                                            | Covers                | Intent                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------ |
| `lib/b2b/exchange/supplierIntake.test.ts › [SWHR-C-0089] does not persist an invalid supplier order when validation is enabled`                 | AC-1 (SWHR-R-0047.01) | schema-invalid partner order → `DocumentInvalidError` from prepare, nothing written        |
| `lib/b2b/exchange/supplierIntake.test.ts › [SWHR-C-0090] processes a supplier order without validation when disabled by deployment`             | AC-2 (SWHR-R-0047.02) | `validateDocument` never called, order persisted despite failing schema                    |
| `lib/b2b/exchange/supplierChannel.test.ts › [SWHR-C-0093] delivers two separate supplier purchase order messages for two approved orders`       | AC-3 (SWHR-R-0049.01) | `sendSupplierPurchaseOrders` with 2 orders → 2 point-to-point messages delivered           |
| `lib/b2b/exchange/invoiceChannel.test.ts › [SWHR-C-0094] fans one published invoice out so fulfilment and notification each get their own copy` | AC-4 (SWHR-R-0049.02) | one `publishInvoices` call → both fixed subscribers receive their own delivery             |
| `lib/b2b/exchange/supplierIntake.test.ts › [SWHR-C-0095] records no supplier order and redelivers the message when invoice publication fails`   | AC-5 (SWHR-R-0050.01) | `shipOnReceipt` throw inside commit → whole transaction rolls back, delivery stays pending |
| `lib/b2b/exchange/supplierIntake.test.ts › [SWHR-C-0096] records no supplier order for a malformed order message`                               | AC-6 (SWHR-R-0050.02) | not-well-formed XML → prepare throws before any transaction opens                          |
| `lib/b2b/exchange/invoiceChannel.test.ts › [SWHR-C-0097] publishes two invoice messages when two pending orders ship (stock arrival)`           | AC-7 (SWHR-R-0051.01) | `publishInvoices` with 2 invoices → 2 `opc.invoice` messages, one per order id             |

Supporting coverage — `lib/messaging/outbox.test.ts` (enqueue's fixed fan-out, transactional rollback,
the consumer registry), `lib/messaging/dispatcher.test.ts` (delivered/pending/dead transitions, the
atomic commit-then-mark-delivered rollback, the not-yet-due and no-registered-consumer cases),
`lib/b2b/exchange/supplierIntake.test.ts`'s persistence/money-conversion and default-`shipOnReceipt`
tests, and `plugins/outbox-dispatcher.test.ts` (inactive under Vitest, polls at the configured/default
interval otherwise) — exercises the interface contract itself rather than a numbered spec scenario, so
no separate approved case id applies.

## Red run

`NODE_ENV=test bun --bun vitest run lib/messaging lib/b2b/exchange plugins`, with every implementation
file this ticket adds (`lib/messaging/{outbox,dispatcher}.ts`,
`lib/b2b/exchange/{supplierChannel,invoiceChannel,supplierIntake}.ts`,
`plugins/outbox-dispatcher.ts`) swapped for a stub throwing the configured stub sentinel (types/exports kept,
so only behaviour — not imports — was missing):

```
Test Files  6 failed (6)
     Tests  25 failed (25)
```

Every test failed — a clean red with no coincidental passes.

## Green run

`bun run verify` — this stack's full pre-commit gate (lint + typecheck + the complete unit/integration
suite), with the real implementation restored:

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(clean)
$ tsc --build
(clean)
$ NODE_ENV=test bun --bun vitest run
 Test Files  74 passed (74)
      Tests  326 passed (326)
```

Also confirmed `bun run build` succeeds (the new tables, migration and Nitro plugin build cleanly; the
plugin is bundled into `.output/server/index.mjs`). `bun run verify:full`'s E2E tier was attempted; its
preflight reported Chromium is not installed in this container — per AGENTS.md this means fall back to
`verify` rather than retry or install a browser. This ticket has no UI.

TDD-RESULT: 326 passed, 0 failed
