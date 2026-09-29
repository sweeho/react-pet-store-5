# PLAN — SWHR-T-0150: Server API (task group 4)

Change: `swhr-i-0012-supplier-inventory`. Read its `design.md` §"Sprint planning — SWHR-S-0015" first. Requirements: **Negative stock quantity is ignored per row** (through the route), plus the transport for **Stock update applies only to selected rows**, **Stock update re-attempts pending supplier orders** and **Inventory unavailable state**.

## Design reference

No design blocks apply: this ticket has no screen. The screens are SWHR-T-0152's (`artifacts/SWHR-S-0015/design/`).

## Objective

Expose the stock list and the batch update to the supplier screens, behind the supplier administrator role.

## Steps

1. Read P4, then copy the shape of `routes/api/admin/launch.get.ts` (`requireRole`) and its test for a real `H3Event` with a signed-on staff session.
2. Write `routes/api/supplier/inventory.test.ts` first: SWHR-C-0397 through POST (EST-7 ticked "-5", EST-8 ticked "30" → 200, EST-7 40, EST-8 30); GET lists records in natural order; GET answers 500 `INVENTORY_UNAVAILABLE` when the lookup throws (spy on `listStockRecords`); POST answers 400 `INVALID_BATCH` with the offending ids for "abc" and for an unknown item, and for a malformed body, writing nothing; POST answers 500 and writes nothing when `updateInventory` throws; both methods answer 401 with no supplier session and 403 for a supplier session without the role. You may also cite SWHR-C-0393 to SWHR-C-0396 through the route.
3. Implement `inventory.get.ts` (`listStockRecords`) and `inventory.post.ts` (body shape check, then `updateInventory`) per P4.

## File/module ownership

- new `routes/api/supplier/inventory.get.ts`, `routes/api/supplier/inventory.post.ts`, `routes/api/supplier/inventory.test.ts`

## Definition of Done

AC-1 to AC-3 of the ticket.
