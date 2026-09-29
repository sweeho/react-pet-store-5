---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0010
idea: SWHR-I-0008
branch: vortex/sprint/swhr-s-0010-c3edd958
upstream: [artifacts/SWHR-S-0010/qa-test-report.md, artifacts/SWHR-S-0010/sprint-summary.md]
---

# Release notes — SWHR-S-0010

## Added

- **Shopping cart page.** `/cart` lists one row per item: its name linked back to the item, a Remove control, an editable quantity and the list price. Below the rows are Update Cart, the subtotal and Check Out. An empty cart shows "Your Shopping Cart is Empty." and nothing else. (SWHR-T-0099)
- **Update Cart saves every changed quantity at once.** A quantity of 0 or less, or one that is not a whole number, removes that line without an error. (SWHR-T-0097, SWHR-T-0098, SWHR-T-0099)
- **Cart count in the header.** The Cart link shows how many different items are in the cart, not how many units, and updates as soon as the cart changes. (SWHR-T-0099)
- **Always the current price.** The cart shows the list price in the shopper's language, read fresh each time, so a price change after adding shows the new price. The subtotal is list price times quantity over all lines, with no discount, tax or shipping. (SWHR-T-0097)
- **Anonymous use.** Anyone can add, remove and update without signing in. Check Out asks an anonymous shopper to sign in. Signing out discards the cart. (SWHR-T-0098, SWHR-T-0100)

## Changed

- Adding an item that is already in the cart keeps one line and sets its quantity to 1. It previously incremented. See Known issues. (SWHR-T-0097)
- The cart API now answers one shape, a `CartView` (lines, count, subtotal, locale), from `GET`/`PATCH /api/cart`, `POST /api/cart/items` and the new `DELETE /api/cart/items/:itemId`. `POST` answers 404 for an unknown item and 400 without `itemId`. (SWHR-T-0098)
- An item the catalogue can no longer supply in the current language drops out of the list and the subtotal without an error, but still counts in the header. (SWHR-T-0097)

## Upgrade notes

- No migration. The existing `cartLines` table is unchanged.

## Known issues

- Re-adding an item resets its quantity to 1, while the product decision is that it increments. The spec is being corrected (SWHR-T-0103).
- "Placing an order empties the cart" is verified at service level only, until checkout ships.

## Verification

Verified at integration QA with a PASS verdict. All 25 shopping-cart scenarios pass, as do 763 unit and integration tests, lint and typecheck. All 62 Chromium E2E tests pass, including the new cart journey. See [qa-test-report.md](qa-test-report.md).

## Compliance / Control Evidence

| Control                      | Evidence        | Location                                  | Status    | Exception |
| ---------------------------- | --------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded    | this file       | `artifacts/SWHR-S-0010/release-notes.md`  | Satisfied | —         |
| Release verified before land | QA PASS verdict | `artifacts/SWHR-S-0010/qa-test-report.md` | Satisfied | —         |
| Known limitations disclosed  | Known issues    | this file; SWHR-T-0103                    | Satisfied | —         |
