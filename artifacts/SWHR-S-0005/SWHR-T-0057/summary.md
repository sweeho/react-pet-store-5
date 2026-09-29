---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0005
ticket: SWHR-T-0057
branch: vortex/feat/SWHR-T-0057-catalog-data-model-attributes-length-che-af8d6440
upstream: [artifacts/SWHR-S-0005/SWHR-T-0057/PLAN.md]
downstream: [artifacts/SWHR-S-0005/qa-test-report.md]
---

# Summary — SWHR-T-0057: Catalog data model: attributes, length checks and enforced foreign keys

## What changed

Added the five optional item attributes to `itemDetails`, added `CHECK (length(...) <= n)` constraints
for the identifier/name/description/attribute limits named in the change's design (SD4), and turned on
`PRAGMA foreign_keys = ON` in `db/client.ts` (SD3) so `references()` in `db/schema.ts` are enforced.
Generated and committed the resulting migration. Fixed every existing test fixture that broke only
because FK enforcement now rejects what it silently allowed before (an orphaned child insert, a
parent delete performed before its children).

## Files

- `db/schema.ts` — `attr1`–`attr5` on `itemDetails`; length `CHECK`s on `category.id`, `product.id`,
  `item.id`, `categoryDetails.name/image/description`, `productDetails.name`, `itemDetails.name/description/attr1..attr5`.
- `db/client.ts` — `sqlite.exec("PRAGMA foreign_keys = ON")` before `migrate`.
- `drizzle/0005_mean_mach_iv.sql`, `drizzle/meta/0005_snapshot.json`, `drizzle/meta/_journal.json` — generated migration (SQLite table-rebuild, since it can only add a `CHECK` by recreating the table).
- `lib/catalog/schema.test.ts` — new; one test per AC plus the length/attribute constraints named in PLAN step 2.
- `lib/cart/lines.test.ts` — fixture fix: cart lines now attach to a real `sessions` row and a real `item` row (previously a bare `crypto.randomUUID()` and literal `"item-1"`/`"item-2"`/`"does-not-exist"` ids, never enforced before this ticket).
- `lib/auth/{credentials,protection,roles,session}.test.ts`, `middleware/signon.test.ts`, `routes/api/{session,signoff,signon,customers}.test.ts`, `routes/api/signon/gate.test.ts`, `routes/api/staff/{session,signon}.test.ts`, `routes/api/users/index.test.ts`, `routes/api/admin/{orders,launch}.test.ts` — fixture fixes: each either deletes `groupMembers` before `users` in its cleanup (the dev-seeded `admin_member` row blocked the delete), or creates the real `users` row a test's `sessions.userId` / `groupMembers.userId` now requires.

## AC coverage

- AC-1 / SWHR-C-0149 (category details without a name rejected) — `categoryDetails.name` NOT NULL (pre-existing), proven by `schema.test.ts › [SWHR-C-0149] …`.
- AC-2 / SWHR-C-0150 (duplicate details for the same locale rejected) — `categoryDetails` PK `(categoryId, locale)` (pre-existing), proven by `schema.test.ts › [SWHR-C-0150] …`.
- AC-3 / SWHR-C-0152 (product referencing a missing category rejected) — `db/client.ts`'s new `PRAGMA foreign_keys = ON`, proven by `schema.test.ts › [SWHR-C-0152] …`.
- AC-4 / SWHR-C-0153 (item prices held to two decimal places) — integer minor units round-trip through `lib/locale/money.ts#formatPrice` exactly, proven by `schema.test.ts › [SWHR-C-0153] …`.
- AC-5 / SWHR-C-0154 (item details without a price rejected) — `itemDetails.unitCost` NOT NULL (pre-existing), proven by `schema.test.ts › [SWHR-C-0154] …`.

## Verification

```
$ bun run verify
lint ✓  typecheck ✓
NODE_ENV=test bun --bun vitest run
 Test Files  113 passed (113)
      Tests  507 passed (507)
```

`bun run verify:full` was attempted; its E2E preflight reports Chromium is genuinely not installed in
this container, so E2E was not run here (per AGENTS.md, this is the documented fallback — E2E runs in
the QA/CI containers). This ticket carries platform-linked test cases, so `tdd-test-result.md` carries
the recorded run ids rather than a `TDD-RESULT:` marker (see below).

## Notes

Turning FK enforcement on for the whole database (not just the catalog tables) broke 16 existing test
files beyond PLAN's cited example — every one was a test setting `sessions.userId` / `groupMembers.userId`
to a synthetic id with no matching `users` row, or a `beforeEach` deleting `users` before its dependent
`groupMembers` row (the dev seed's `admin_member`). Fixed per PLAN step 6: fixture fixes only, no
application-code or pragma changes. No `PLAN.md` deviation — this is exactly the class of regression
PLAN step 6 anticipated, just wider than its one named example.

This ticket carries five platform-approved test cases (SWHR-C-0149/-0150/-0152/-0153/-0154). Only
SWHR-C-0152 (the FK case) describes behavior this ticket actually changes; the other four assert
`NOT NULL`/primary-key/integer-price invariants that already existed in `db/schema.ts` before this
ticket (since the localization migration, `drizzle/0002_gray_the_hood.sql`). `a2a_run_tests(phase:
"red")` confirmed this: those four report `pass`, not a failure, so a valid red run for them is not
obtainable without deliberately regressing unrelated, already-shipped behavior — which the tool's own
instructions say not to do. Disputed all four via `a2a_dispute_test_case` rather than game the gate;
see `tdd-test-result.md` and the ticket comments for detail. The tests themselves are written, cited,
and passing regardless of how the dispute resolves.

The dispute resolved with all four cases re-approved unchanged, and the ticket auto-unblocked. The
`a2a_run_tests(phase: "green")` run at the implementation commit reports `pass` for all five cases
(including SWHR-C-0152) with no case modified after red; its overall `invalid` verdict is caused solely
by stub-sentinel text in unrelated pre-existing artifact files from other tickets (`SWHR-S-0003`,
`SWHR-S-0004`), not by anything this ticket owns. Per this project, DONE does not gate on this run —
see `tdd-test-result.md` for the full breakdown.
