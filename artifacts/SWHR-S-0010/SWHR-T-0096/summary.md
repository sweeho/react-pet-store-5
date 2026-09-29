# SWHR-T-0096 summary

Published the shared `CartLine`/`CartView` contract and an `emptyCartView` helper in `lib/cart/types.ts`. Confirmed `cartLines` (session id, item id, integer quantity, added-at, unique session+item; created by `drizzle/0004_lonely_pete_wisdom.sql`) already meets tasks 1.1, 1.2, 1.4; no migration. Updated the `cartLines` comment in `db/schema.ts`.

Deviation: added `emptyCartView` (not in PLAN.md) so the red run could fail on a stub rather than an import error.

AC coverage: AC-1 and AC-2 in `lib/cart/types.test.ts` ([SWHR-C-0237], [SWHR-C-0239]).

Verification: `bun run verify` (see results below in work log). Design not consulted: no UI change.
