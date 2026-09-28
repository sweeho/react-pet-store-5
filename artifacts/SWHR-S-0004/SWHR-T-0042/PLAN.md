---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0004
ticket: SWHR-T-0042
idea: SWHR-I-0005
branch: Not Provided
upstream:
  [
    openspec/changes/swhr-i-0005-sign-on-and-access-control/design.md,
    openspec/changes/swhr-i-0005-sign-on-and-access-control/specs/sign-on/spec.md,
  ]
---

# PLAN — SWHR-T-0042 · Data model

Change `swhr-i-0005-sign-on-and-access-control` · tasks.md group 1. Read `openspec/changes/swhr-i-0005-sign-on-and-access-control/design.md` first: §Planning (findings, P1–P14, SD-1–SD-8) and §Interface contracts. Each approved test case in `openspec/changes/swhr-i-0005-sign-on-and-access-control/test-cases.md` for your scenarios becomes a test whose name carries its `SWHR-C-*` id (P14).

## Objective

The schema holds credentials, per-realm sessions, roles, customers and cart lines in the shapes the later tickets code against. The boilerplate `users` example is gone, and supplier-order data can be read with no access check.

## Steps

1. `db/schema.ts`: reshape `users` and re-key `profiles` (P1). Add `sessions` (P4), `role_assignments` and `group_members` (P10), `customers` (P8) and `cart_lines` (P9). Generate the migration and commit it with its meta. The migration must apply cleanly to an existing dev `sqlite.db` that still holds the demo users (P1: drop and recreate `users` and `profiles`).
2. Delete `routes/api/users/**` (all six files) and the `GET /api/users` assertion in `e2e/smoke.spec.ts` (P1). Repoint `README.md`'s references to the deleted routes at `routes/api/catalog/`.
3. `lib/locale/preference.ts` and its test: `userId` becomes a `string` (P1).
4. `db/client.ts`: remove the demo-user seed. Outside production, seed `jps_admin`, `supplier` and `admin_member` with `Bun.password.hashSync` passwords, plus the four role assignments and the group membership (P2, P10). Read the database path from `SQLITE_PATH`, defaulting to `sqlite.db` in the working directory (P14). The Vitest in-memory database is unchanged.
5. `lib/b2b/exchange/supplierOrders.ts`: `getSupplierOrder` and `listSupplierOrders` (§Interface contracts). They make no role or session check (SD-3). Write test case SWHR-C-0131 against them.

## File/module ownership

- `db/schema.ts`, `db/client.ts`, `drizzle/` (the new migration and its meta)
- `routes/api/users/**` (deleted), `e2e/smoke.spec.ts` (the users assertion only), `README.md` (the users-route references only)
- `lib/locale/preference.ts` and `preference.test.ts`
- `lib/b2b/exchange/supplierOrders.ts` and its test (new)

## Definition of Done

- AC-1.
- The app starts and seeds on both a fresh and an existing dev database, and the existing suites still pass.

## Design reference

No screen in this ticket. Mockups: `artifacts/SWHR-S-0004/design/` (see `MANIFEST.md`).
