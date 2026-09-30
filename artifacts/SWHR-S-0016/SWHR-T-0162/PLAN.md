# PLAN — SWHR-T-0162: Tests (task group 5)

Change: `swhr-i-0013-customer-notifications`. Read its `design.md` §"Sprint planning — SWHR-S-0016" first (Phases 5 and 6, Risks). Requirements: **Notification sequence over an order's life**, **Asynchronous email delivery** and **Send failure handling**, end to end, plus case coverage for the whole change.

## Design reference

No design blocks apply: this ticket adds tests only. The e-mail designs are SWHR-T-0159's (`artifacts/SWHR-S-0016/design/`).

## Objective

Prove the three cross-cutting scenarios through the real outbox, producers and mailer. Keep every approved case bound to a passing test after the change archives.

## Steps

1. Create `lib/notifications/scenarios/customer-notifications.test.ts`. Use the in-memory database, all real consumers registered (order-intake, order-approval, supplier-intake, order-fulfillment, customer-notification, mailer), and a controllable `MailTransport`. Copy the setup from `lib/b2b/scenarios/order-fulfillment.test.ts`.
   - SWHR-C-0417: approve an order, ship it in two invoices where the second completes it, and drain both pollers' channels. Exactly four e-mails: one approval, two shipment, one completed.
   - SWHR-C-0420: the transport's `send` does not resolve until the test releases it. The approval commits and reads as APPROVED while the send is still waiting. After release, the approval e-mail is captured. Use `only`/`except` as the plugins do, so the general pass never waits on mail.
   - SWHR-C-0426: the transport throws. The failure is logged (spy on the logger), the delivery is `delivered` with one attempt, a second pass sends nothing, and the order is still APPROVED.
2. Add `lib/notifications/scenarios/coverage.test.ts`. It holds the literal list SWHR-C-0001 and SWHR-C-0413 to SWHR-C-0430, scans `lib/**` and `plugins/**` test files for each id in a test title, and fails naming any id with no citing test. Do not read `openspec/changes/`, which moves at archive.
3. Run the existing `lib/b2b/scenarios/` suites with the new consumers registered, and fix only what this change broke. If a behaviour fix belongs to another ticket's file, escalate to planning.
4. If a gap in 5.1 to 5.4 is found (a validator, template, gating, worker or start-up case with no test), add the test here, in a new file under `lib/notifications/scenarios/`.

## File/module ownership

- new `lib/notifications/scenarios/customer-notifications.test.ts`, `lib/notifications/scenarios/coverage.test.ts`, and any further new test file under `lib/notifications/scenarios/`

## Definition of Done

AC-1 to AC-5 of the ticket.
