## 1. Data model and configuration

- [ ] 1.1 Add the mail outbox Drizzle table (recipient, subject, html_body, status, error, created_at, sent_at) in `db/` (SWHR-T-0158)
- [ ] 1.2 Generate and commit the migration in `drizzle/` (SWHR-T-0158)
- [ ] 1.3 Add server configuration for the three notification switches, SMTP host/account and sender address (default `customerservice@javapetstoredemo.com`) (SWHR-T-0158)
- [ ] 1.4 Validate the switches at server start and fail start-up on a missing or non-boolean value (SWHR-T-0158)

## 2. Mail request and sender

- [ ] 2.1 Define the mail request type (recipient, subject, body) and its validator (SWHR-T-0160)
- [ ] 2.2 Implement the enqueue function used by notification producers (SWHR-T-0160)
- [ ] 2.3 Implement the SMTP send helper (To, subject, UTF-8 HTML body, sent date, configured From) (SWHR-T-0160)
- [ ] 2.4 Implement the Nitro outbox worker that drains pending rows and sends one email per row (SWHR-T-0160)
- [ ] 2.5 Mark malformed rows failed without sending, and mark send failures failed with a logged error and no retry (SWHR-T-0160)

## 3. Email templates

- [x] 3.1 Implement the approval decision template (approved and denied wording) for en_US, ja_JP and zh_CN (SWHR-T-0159)
- [x] 3.2 Implement the shipment template with the Category / Product # / Quantity / Unit Price table for each locale (SWHR-T-0159)
- [x] 3.3 Implement the completed-order template listing every order line for each locale (SWHR-T-0159)
- [x] 3.4 Implement per-locale currency formatting for unit prices (SWHR-T-0159)

## 4. Notification producers

- [ ] 4.1 Enqueue one approval decision email per order when an approval batch is recorded, gated by the approval switch (SWHR-T-0161)
- [ ] 4.2 Enqueue a shipment email on each invoice received, gated by the shipment switch and independent of completion (SWHR-T-0161)
- [ ] 4.3 Enqueue a completed-order email when an order becomes completed, gated by the completed-order switch (SWHR-T-0161)
- [ ] 4.4 Ensure a disabled switch consumes the trigger without affecting order processing (SWHR-T-0161)

## 5. Tests

- [ ] 5.1 Unit-test the mail request validator and each template (both approval outcomes, shipment table, completed list, each locale) (SWHR-T-0162)
- [ ] 5.2 Integration-test the producers for subjects, recipients, switch gating and the double email on a completing invoice (SWHR-T-0162)
- [ ] 5.3 Integration-test the outbox worker for success, malformed rows and SMTP failure with no retry (SWHR-T-0162)
- [ ] 5.4 Test that start-up fails on a missing or invalid notification switch (SWHR-T-0162)
