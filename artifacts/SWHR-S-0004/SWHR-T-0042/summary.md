---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0004
ticket: SWHR-T-0042
branch: vortex/feat/SWHR-T-0042-data-model-credential-session-role-custo-0827349d
upstream: [artifacts/SWHR-S-0004/SWHR-T-0042/PLAN.md]
downstream: [artifacts/SWHR-S-0004/qa-test-report.md]
---

# Summary — SWHR-T-0042: Data model — credential, session, role, customer and cart-line tables, staff seeds

## What changed

Reshaped `users`/`profiles` into the sign-on credential table (P1), added `sessions` (P4), `customers` (P8), `cartLines` (P9), `roleAssignments`/`groupMembers` (P10) to `db/schema.ts`, and generated the migration. `db/client.ts` now reads `SQLITE_PATH`, drops the boilerplate demo-user seed, and seeds `jps_admin`/`supplier`/`admin_member` plus their role grants outside production. Deleted the boilerplate `routes/api/users/**`. Added `lib/b2b/exchange/supplierOrders.ts` (`getSupplierOrder`/`listSupplierOrders`) with no role/session check, per SD-3.

## Files

- `db/schema.ts` — reshaped `users`/`profiles`; added `sessions`, `customers`, `cartLines`, `roleAssignments`, `groupMembers`.
- `db/client.ts` — `SQLITE_PATH`; removed the demo-user seed; added the outside-production staff/role seed.
- `drizzle/0004_lonely_pete_wisdom.sql`, `drizzle/meta/0004_snapshot.json`, `drizzle/meta/_journal.json` — the generated migration (see Notes on how it was produced).
- `routes/api/users/{index.get,index.post,[id]}.ts` and their `.test.ts` files — deleted.
- `e2e/smoke.spec.ts` — the database-backed-route probe now hits `GET /api/catalog/products/BULLDOG` instead of the deleted `GET /api/users`.
- `README.md` — the two concrete pointers at the deleted `routes/api/users/**` files (the "make it yours" table row, the "full read example" line, and the stale test-inventory rows) repointed at `routes/api/catalog/**`.
- `lib/locale/preference.ts` — `applyPreferredLanguageOnSignOn`'s `userId` is now `string`.
- `lib/locale/preference.test.ts` — `createUser` helper adapted to the text-keyed `users` table; unrelated in behaviour.
- `lib/b2b/exchange/supplierOrders.ts` (new) — `getSupplierOrder`, `listSupplierOrders`.
- `lib/b2b/exchange/supplierOrders.test.ts` (new) — SWHR-C-0131 plus two supporting cases.

## AC coverage

- AC-1 (SWHR-R-0071.01, "internal caller reads a purchase order: the data layer returns it without a role check of its own") — `lib/b2b/exchange/supplierOrders.ts:getSupplierOrder`, whose signature takes only `orderId` (no session/role argument), covered by `supplierOrders.test.ts › [SWHR-C-0131]`. Per SD-3 there is no purchase-order store yet, so this is exercised on the supplier-order read functions the requirement text also names.
- PLAN.md DoD "the app starts and seeds on both a fresh and an existing dev database" — verified manually (see Verification); not exercised by Vitest since the in-memory suite starts fresh every run.

## Verification

```
$ bun run verify
lint ✓  typecheck ✓
Test Files  74 passed (74)
     Tests  325 passed (325)
```

`bun run verify:full`'s E2E tier could not run — `scripts/ensure-playwright-browser.mjs` reports Chromium is not installed in this container. Not retried, per AGENTS.md; E2E runs in the QA phase / CI.

Migration/seed behaviour was verified manually, outside Vitest's in-memory db, by pointing a real `db/client.ts` import at file-backed SQLite databases via `SQLITE_PATH`:

- **Fresh db**: 3 users and 5 categories seeded on first import.
- **Existing dev db** (built by applying only migrations 0000–0003 and inserting the old `users(id, name, email)` demo rows, mirroring a checkout that predates this ticket): importing `db/client.ts` against it applied `0004_lonely_pete_wisdom.sql` — dropping and recreating `users`/`profiles` — with no error, and produced the expected 3 staff users, 4 role assignments and 1 group member.
- **`NODE_ENV=production`**: no staff seed runs; `users` stays empty.

## Notes

- `drizzle-kit generate` requires interactive TTY prompts (rename-vs-recreate disambiguation) unavailable in this container (`Interactive prompts require a TTY terminal`), and no `expect`/pty tool was available to script it. The migration SQL and its snapshot JSON (`drizzle/meta/0004_snapshot.json`) were hand-authored instead, mirroring drizzle-kit's own output format (verified by running the generated snapshot's `dialect`/`version`/naming conventions against the existing `0003_snapshot.json`, and by the manual fresh/existing-db runs above, which exercise the SQL exactly as `drizzle-orm/bun-sqlite/migrator` would apply it). A future ticket's `drizzle-kit generate` should diff cleanly against this snapshot; if it doesn't, that is evidence the hand-authored snapshot drifted from drizzle-kit's own format and should be corrected then.
- `e2e/smoke.spec.ts`'s "a database-backed route responds" test is a minor deviation from PLAN.md, which said only to delete the `GET /api/users` assertion: the test's own comment explains its purpose is to catch a Bun-vs-Node import regression on any DB-backed route, so it was repointed at `GET /api/catalog/products/BULLDOG` (an existing, seeded product) rather than dropped, preserving that regression coverage.
- Seed passwords for `jps_admin`/`supplier`/`admin_member` are each the user id itself — deliberately memorable dev-only demo data (SD-8), the same convention the legacy app used (`j2ee`/`j2ee`), never seeded outside development.
