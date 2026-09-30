---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0016
idea: SWHR-I-0013
branch: vortex/sprint/swhr-s-0016-6b959966
upstream: [artifacts/SWHR-S-0016/qa-test-report.md, artifacts/SWHR-S-0016/sprint-summary.md]
---

# Release notes — SWHR-S-0016

## Added

- **Approval decision e-mail.** Sent once per order when it is approved (automatically or by an administrator) or denied, including one e-mail per order in an administrator's batch. Subject `Java Pet Store Order Status: <id>`; it thanks the customer, shows the order id and says "approved! We will now fulfill your order." or "denied unfortunately. Sorry we could not place your order." (SWHR-T-0159, SWHR-T-0161)
- **Shipment e-mail.** Sent for every shipment, including the last. Subject `Java Pet Store Order Shipped: <id>`; lists only the shipped items as Category, Product #, Quantity and Unit Price, priced in the order's currency. (SWHR-T-0159, SWHR-T-0161)
- **Order completed e-mail.** Sent when the whole order has shipped. Subject `Java Pet Store Order COMPLETED: <id>`; lists every item. (SWHR-T-0159, SWHR-T-0161)
- **Localized bodies.** Each e-mail is HTML in the order's language: English, Japanese or Simplified Chinese. Subjects are English in every language. (SWHR-T-0159)
- **Queued, non-blocking delivery.** E-mails are queued and sent afterwards by a separate mail sender, so approving an order or recording a shipment never waits on the mail server. A queued e-mail survives a restart. (SWHR-T-0158, SWHR-T-0160)
- **Per-kind switches.** `configs/notification-config.json` turns each kind on or off (`sendApprovalMail`, `sendShipmentMail`, `sendCompletedOrderMail`); all three ship on. A switched-off kind is skipped and the order carries on. (SWHR-T-0158, SWHR-T-0161)

## Changed

- A failed send is logged and dropped, never retried, and never affects the order. A malformed mail request is discarded at once. (SWHR-T-0160)
- The outbox now marks a delivery dead on its first attempt when its handler reports a non-retryable error; all other failures retry as before. (SWHR-T-0160)
- The earlier plain-text e-mail templates from localization are replaced by the HTML ones, with new subjects. (SWHR-T-0159)

## Upgrade notes

- New dependency `nodemailer`; install with the lockfile. No database migration.
- New settings: `SMTP_HOST` (default `localhost`), `SMTP_PORT` (default 25, must be an integer), `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` (default `customerservice@javapetstoredemo.com`), and `NOTIFICATION_CONFIG_PATH` to move the switch file.
- The server refuses to start if the switch file is missing or unreadable, or a switch is missing or not `true`/`false`.
- **First deploy sends a backlog.** Orders placed since the order-processing sprints already have queued notification triggers, and their customers will receive those e-mails at once. Switch the kinds off for the first start to discard them.

## Known issues

- Japanese and Chinese wording has not yet been signed off by a human.
- Subjects are English in every language, and say "Java Pet Store" while the e-mail heading says "Pet Store".
- Without a reachable mail server (the default in development and tests), every send fails and is logged.

## Not included

Retry, dead-letter alerting or resending of failed e-mails; order history or look-up screens; e-mail to anyone but the customer on the order.

## Verification

Verified at integration QA with a PASS verdict. All 19 customer-notifications scenarios pass, as do 1073 unit and integration tests and 74 Chromium E2E tests. See [qa-test-report.md](qa-test-report.md).

## Compliance / Control Evidence

| Control                      | Evidence        | Location                                  | Status    | Exception |
| ---------------------------- | --------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded    | this file       | `artifacts/SWHR-S-0016/release-notes.md`  | Satisfied | —         |
| Release verified before land | QA PASS verdict | `artifacts/SWHR-S-0016/qa-test-report.md` | Satisfied | —         |
| Known limitations disclosed  | Known issues    | this file; sprint-summary.md §Open items  | Satisfied | —         |
