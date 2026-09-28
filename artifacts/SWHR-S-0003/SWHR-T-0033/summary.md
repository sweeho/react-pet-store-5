---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0003
ticket: SWHR-T-0033
branch: vortex/feat/SWHR-T-0033-asynchronous-exchange-sqlite-outbox-and-2c44b43a
upstream: [artifacts/SWHR-S-0003/SWHR-T-0033/PLAN.md]
downstream: [artifacts/SWHR-S-0003/qa-test-report.md]
---

# Summary — SWHR-T-0033: Asynchronous exchange — SQLite outbox and dispatcher, supplier purchase order channel, invoice fan-out and atomic supplier intake

## What changed

Added the one SQLite outbox (`lib/messaging/`) every asynchronous hop in this codebase now uses:
`enqueue` writes a message plus one delivery row per channel's fixed subscriber list, inside the
caller's own transaction; `dispatchPending` runs each due delivery's async prepare then its sync commit
together with marking it delivered in one `db.transaction()`, so a commit failure rolls back everything
including the delivered mark, and a separate write afterward records the retry (or `dead`, past
`OUTBOX_MAX_ATTEMPTS`). A Nitro plugin polls it, inactive under Vitest. On top of that: the supplier
purchase order channel, invoice fan-out, and atomic supplier intake that persists the order and ships
via an injected hook inside the same transaction as the intake message's commit.

## Files

- `db/schema.ts` — `outboxMessages`, `outboxDeliveries`, `supplierOrders`, `supplierContacts`, `supplierAddresses`, `supplierLineItems` (design.md P4/P5), plus the generated `drizzle/0003_wet_boomer.sql` migration.
- `lib/messaging/outbox.ts` — `Channel`, `Tx`, `Handler`, `enqueue`, `registerConsumer`, `getConsumer` (the last an addition — the consumer registry needed a read side for `dispatcher.ts`).
- `lib/messaging/dispatcher.ts` — `dispatchPending`.
- `lib/b2b/exchange/supplierChannel.ts` — `sendSupplierPurchaseOrders`.
- `lib/b2b/exchange/invoiceChannel.ts` — `publishInvoices`.
- `lib/b2b/exchange/supplierIntake.ts` — `createSupplierIntakeHandler`, persisting the order (money converted to exact cents via string arithmetic, never `parseFloat`).
- `plugins/outbox-dispatcher.ts` — the poller; `tsconfig.node.json`'s `include` gained `plugins`.
- One `*.test.ts` per file above (25 new tests), plus `vitest.config.ts` (see Notes).

## AC coverage

AC-1…AC-7 (ticket order) — one row each in `tdd-test-result.md`'s `## Test cases`, naming the exact
test and the requirement/scenario it proves.

## Verification

```
$ bun run verify
lint ✓  typecheck ✓
Test Files  74 passed (74)
     Tests  326 passed (326)
$ bun run build
... succeeds; the plugin bundles into .output/server/index.mjs
$ bun run verify:full
... E2E preflight: Chromium not installed in this container — expected per AGENTS.md,
    fell back to `verify` (no UI in this ticket to exercise anyway).
```

See `tdd-test-result.md` — `TDD-RESULT: 326 passed, 0 failed`.

## Notes

- **Deviation from file ownership: `vitest.config.ts`.** PLAN.md's ownership lists `tsconfig.node.json`
  (`plugins` include only) but not `vitest.config.ts`. Without a matching change there,
  `plugins/outbox-dispatcher.test.ts` fell into the default "client" (jsdom) project — where
  `lib/messaging/dispatcher.ts`'s `bun:sqlite` import cannot resolve, the same reason `routes/**` and
  `lib/**` already run under the "server" project. Added `plugins/**/*.test.ts` to the server project's
  include and `plugins/**` to the client project's exclude — the same two-line pattern SWHR-T-0028
  established for `lib/**`. Minimal, required by this ticket's own test, and not shared with any
  concurrently-owned file.
- **`getConsumer` is an addition to the frozen `lib/messaging/outbox.ts` contract** (allowed — "a ticket
  may add exports but must not change these"): `dispatcher.ts` needs a read side for the consumer
  registry `registerConsumer` writes to.
- **AC-1/AC-2's "fails schema validation" fixture is a duplicate `itemId`, not zero `LineItem`s.**
  Removing every `LineItem` also trips the _reader's own_ structural requirement (`elements("LineItem", 1)`
  in `lib/b2b/partner/supplierOrderIntake.ts`, from SWHR-T-0031) regardless of the validation switch,
  which would make AC-2 ("processed without being validated") impossible to demonstrate — that fixture
  is unreadable by construction, not merely schema-invalid. A duplicate `itemId` trips only the XSD's
  `xs:unique` constraint (SD's R9: schema-only, no reader-level check), so it is well-formed and
  structurally readable but schema-invalid, which is what both scenarios actually need.
- **Retry backoff (linear, `attempts × 1s`) is my own choice** — design.md P4 leaves the exact delay
  open ("schedules a retry"), only fixing the default `OUTBOX_MAX_ATTEMPTS` (10).
- **`intakeSupplierOrder` (SWHR-T-0031) already implements the AC-1/AC-2 validation behaviour** — this
  ticket's `createSupplierIntakeHandler` uses it as-is for the handler's prepare phase; nothing in
  `lib/b2b/partner/` was touched.
