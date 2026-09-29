---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0013
idea: none
branch: vortex/sprint/swhr-s-0013-b484a233
upstream: [artifacts/SWHR-S-0013/qa-test-report.md, artifacts/SWHR-S-0013/sprint-summary.md]
---

# Release notes — SWHR-S-0013

## Fixed

- **An order with no e-mail is no longer confirmed and then lost.** Before this fix, checkout accepted an order when the billing e-mail was blank and the account had no e-mail either. The shopper saw "Your Order is Complete", but the order was never stored. Now such an order is refused: the general error page is shown, no order is placed and the cart is kept. A blank billing e-mail still uses the account's e-mail when there is one. (SWHR-T-0125)

## Upgrade notes

- No migration, no API shape change and no screen change. `POST /api/orders` now answers 400 with `missing: ["billing.email"]` when there is no contact e-mail.
- Orders placed before this release with no e-mail are not recovered. They remain as dead `opc.purchase-order` deliveries in the outbox.

## Known issues

- The refusal is shown on the general error page, not next to the e-mail field, as with every other missing checkout field.

## Verification

Verified at integration QA with a PASS verdict. All 3 affected checkout scenarios pass, as do 823 unit and integration tests and 64 Chromium E2E tests. See [qa-test-report.md](qa-test-report.md).

## Compliance / Control Evidence

| Control                      | Evidence        | Location                                  | Status    | Exception |
| ---------------------------- | --------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded    | this file       | `artifacts/SWHR-S-0013/release-notes.md`  | Satisfied | —         |
| Release verified before land | QA PASS verdict | `artifacts/SWHR-S-0013/qa-test-report.md` | Satisfied | —         |
| Known limitations disclosed  | Known issues    | this file; sprint-summary.md §Open items  | Satisfied | —         |
