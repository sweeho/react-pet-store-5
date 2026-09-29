---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0011
idea: SWHR-I-0009
branch: vortex/sprint/swhr-s-0011-b79928f1
upstream: [artifacts/SWHR-S-0011/qa-test-report.md, artifacts/SWHR-S-0011/sprint-summary.md]
---

# Release notes — SWHR-S-0011

## Added

- **Checkout.** Check Out in the cart opens the order information form. A shopper who is not signed in signs in first and then comes back to the form. (SWHR-T-0111)
- **Pre-filled order form.** Billing Information and Shipping Information are filled in from the shopper's account, and either can be edited. Country is United States, Canada, Japan or China. The form shows the masked card on the account that will be charged, with a link to change it on the account page. (SWHR-T-0111, SWHR-T-0113)
- **Placing an order.** Submit records the order with a new order number (10011, 10012, …), the cart's lines at list price in the shopper's language, the order total, the language, the account's card and the shipping contact. The cart is then empty. (SWHR-T-0107, SWHR-T-0108, SWHR-T-0109)
- **Your Order is Complete.** The confirmation shows the order number and the e-mail address the confirmation goes to, straight away. Approval, fulfilment and e-mail happen afterwards in the background. (SWHR-T-0110, SWHR-T-0111)
- **Order safety.** An order is either recorded and queued in full, or not at all. A queued order is stored exactly once, even across a restart or a retry. (SWHR-T-0109, SWHR-T-0110)
- **Checkout errors.** A blank required field places no order and shows the general error page. An empty cart, including a re-submit after a successful order, shows the Order Error. Both pages use the site shell's error frame. (SWHR-T-0111, SWHR-T-0112)

## Upgrade notes

- Migration 0007 adds the counter and order tables and two nullable columns on `sessions`. It runs automatically at startup and changes no existing rows.
- New API: `POST /api/orders` (sign-on required) and `GET /api/orders/last`.

## Known issues

- A blank required field is reported only as the general error page, not against the field. This is the decided behaviour, and the spec's wording is still to be corrected.
- When the billing e-mail is blank, the order uses the account's e-mail. This is provisional, pending a product decision.
- When the order has no e-mail address at all, the confirmation leaves out the e-mail sentence.

## Not included

Order approval, supplier fulfilment and customer e-mail are later capabilities. Orders are stored as PENDING until order approval ships. Real card authorisation and order history are non-goals.

## Verification

Verified at integration QA with a PASS verdict. All 30 checkout scenarios pass, as do 821 unit and integration tests and 64 Chromium E2E tests. See [qa-test-report.md](qa-test-report.md).

## Compliance / Control Evidence

| Control                      | Evidence        | Location                                  | Status    | Exception |
| ---------------------------- | --------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded    | this file       | `artifacts/SWHR-S-0011/release-notes.md`  | Satisfied | —         |
| Release verified before land | QA PASS verdict | `artifacts/SWHR-S-0011/qa-test-report.md` | Satisfied | —         |
| Known limitations disclosed  | Known issues    | this file; sprint-summary.md §Open items  | Satisfied | —         |
