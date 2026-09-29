---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0015
idea: SWHR-I-0012
branch: vortex/sprint/swhr-s-0015-781fce36
upstream: [artifacts/SWHR-S-0015/qa-test-report.md, artifacts/SWHR-S-0015/sprint-summary.md]
---

# Release notes — SWHR-S-0015

## Added

- **Supplier home.** Supplier staff who sign in reach a home page explaining that updating inventory lets them fill items marked "Back Ordered", with Display Inventory and Logout. (SWHR-T-0152)
- **Inventory update screen.** One row per stock record with Item Id, Existing Quantity, an empty New Quantity box and an Update box, and one Submit for the whole batch. A row changes only when it is ticked and has a new quantity; the number replaces the stored figure. Blank or negative rows are skipped and the rest is saved. Zero is allowed. (SWHR-T-0148, SWHR-T-0152)
- **No items in inventory.** Shown instead of the table and Submit when there is no stock or the stock list cannot be loaded. (SWHR-T-0152)
- **Update confirmation.** States that the inventory was updated successfully, with Display Inventory and Logout. (SWHR-T-0152)
- **Restock releases waiting orders from the screen.** Submitting saves the stock, re-tries every supplier order waiting for stock and queues an invoice for each order that shipped, all in one step. If any part fails, nothing is saved and an error is shown instead of the confirmation. (SWHR-T-0149)
- **Supplier inventory API.** `GET` and `POST /api/supplier/inventory`, for supplier administrators only. (SWHR-T-0150)

## Changed

- A failure while re-trying a waiting order now rolls back the whole stock update. Previously every failing order was skipped. Only an order whose invoice cannot be built is still skipped. (SWHR-T-0149)
- A non-numeric or fractional quantity, or an unknown item id, rejects the whole batch with nothing saved. (SWHR-T-0148, SWHR-T-0150)
- The starting stock (EST-1 to EST-29 at 10000) loads only into an empty inventory. A forced reload resets those items and is available only as a function call, not over HTTP. (SWHR-T-0151)

## Upgrade notes

- No migration. The stock table from migration 0008 is used as is.
- The startup stock load behaves as before on a fresh database and does nothing when stock exists.

## Known issues

- A stock list that cannot be loaded shows "There are no items in inventory." rather than an error with Try again. This follows the spec; a human may still change it.
- Customer shipment and completion e-mails are queued but not sent until the customer-notifications capability ships.

## Not included

Customer e-mail delivery, a screen for the forced stock reload, and more than one supplier.

## Verification

Verified at integration QA with a PASS verdict. All 23 supplier-inventory scenarios pass, as do 1004 unit and integration tests and 74 Chromium E2E tests. See [qa-test-report.md](qa-test-report.md).

## Compliance / Control Evidence

| Control                      | Evidence        | Location                                  | Status    | Exception |
| ---------------------------- | --------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded    | this file       | `artifacts/SWHR-S-0015/release-notes.md`  | Satisfied | —         |
| Release verified before land | QA PASS verdict | `artifacts/SWHR-S-0015/qa-test-report.md` | Satisfied | —         |
| Known limitations disclosed  | Known issues    | this file; sprint-summary.md §Open items  | Satisfied | —         |
