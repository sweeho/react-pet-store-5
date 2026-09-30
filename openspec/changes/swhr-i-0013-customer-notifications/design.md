## Context

The requirements are in `specs/customer-notifications/spec.md`, and this file does not restate them. It records where each rule came from in the legacy system, the implementation shape on the pinned stack (Vite SPA + Nitro/H3 server, SQLite via better-sqlite3/Drizzle), and the open questions the extraction could not settle.

Legacy sources (all under `legacy-source/petstore1.3.2/`):

| Rule area               | Legacy location                                                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Approval decision email | `src/apps/opc/.../opc/ejb/MailOrderApprovalMDB.java` (156-184), `MailOrderApprovalTransitionDelegate.java` (80-93), `rsrc/xsl/OrderApproval*.xsl`                                       |
| Shipment email          | `MailInvoiceMDB.java` (151-170). It subscribes to the invoice topic on its own, next to InvoiceMDB. `rsrc/xsl/PartialInvoice*.xsl`                                                      |
| Completed-order email   | `MailCompletedOrderMDB.java` (151-171). InvoiceMDB forwards the completed order id to it. `rsrc/xsl/CompletedOrder*.xsl`                                                                |
| Switches                | `ejb-jar.xml` env-entries `param/SendApprovalMail`, `param/SendConfirmationMail` (shipment), `param/SendCompletedOrderMail`. Read by `ServiceLocator.getBoolean`, which has no default. |
| Delivery                | Producers post to `jms/opc/MailQueue`. `components/mailer` MailerMDB parses the `Mail` XML (DTD `OPC Mail 1.0`: Address, Subject, Content) and sends it through `MailHelper`.           |
| Sender and server       | `sun-j2ee-ri.xml` mail session `mail/opc/MailSession`, mail-from `customerservice@javapetstoredemo.com`. `docs/configuring.html` 172-180.                                               |
| Failure handling        | `MailerMDB.java` 83-85: the rethrow is commented out ("user probably forgot to set up mail server").                                                                                    |

In the legacy system, the email body is the order or invoice XML transformed by a per-locale XSL stylesheet. The mailer passes the server's default locale and never uses it, so all localization happens in the producer.

## Goals / Non-Goals

**Goals:**

- Reproduce the three triggers, the per-kind switches, the subjects, the email content and the fire-and-forget delivery.
- Keep order processing independent of mail availability.

**Non-Goals:**

- Retry, dead-lettering or operator alerting for failed sends. The legacy system has none; see Open Questions.
- Emails other than these three, for example account or password mail. The extraction found no source for any.
- Partner (supplier) document exchange. That belongs to `b2b-document-exchange`.

## Decisions

- **D1 Outbox table instead of JMS.** Producers insert a row (recipient, subject, html_body, created_at, status) into a new Drizzle table, `db/schema/mail-outbox.ts` or the project's existing schema file, with the migration generated into `drizzle/`. A Nitro server plugin or scheduled task drains the table and sends each row. This keeps delivery asynchronous (spec: Asynchronous email delivery) using only the pinned datastore. The alternative, sending in-process through `setImmediate`, loses queued mail on restart.
- **D2 Validate at enqueue and at send.** The legacy system validated the `Mail` XML against a DTD. The rebuild validates the three required fields with a typed schema. A row that fails validation is marked failed and never sent. This matches "fail processing, do not send". Redelivery of a malformed request is not reproduced: the legacy system only rolled back to the queue, and redelivering would fail forever.
- **D3 Send failure marks the row `failed` and logs it. No retry.** This reproduces legacy behaviour (spec: Send failure handling) until Q2 is answered.
- **D4 Templates are server-side TypeScript functions per locale** that produce HTML for approval, shipment and completed-order email. XSLT is not carried over.
- **D5 Switches are read and validated at server start.** A missing or non-boolean switch fails start-up (spec: Missing or invalid notification switch fails fast). This follows `ServiceLocator.getBoolean`, which has no default. In the legacy system, a null value raised an unchecked error instead; both outcomes are a start-up failure.
- **D6 SMTP settings (host, account, From) come from server configuration**, never from the mail request. The shipped default From address is `customerservice@javapetstoredemo.com`.
- **D7 The recipient is parsed as a single address.** The legacy system parsed it non-strictly, which also accepted a comma-separated list. No producer ever supplies more than one address, so the rebuild accepts one; see Q4.

## Risks / Trade-offs

- A completing invoice produces two emails (shipment and completed). This is intended legacy behaviour and is specified, but it may look like a duplicate to testers.
- A fire-and-forget design loses customer email silently when SMTP is misconfigured. This is accepted to match legacy behaviour and is flagged as Q2.
- The shipment email template reads category, product and unit price from the invoice lines. The legacy invoice parser (`TPAInvoiceXDE`) extracts only item id and quantity, so those columns may have rendered empty in the legacy system. The rebuild should fill them from the order lines by item id (Q3).

## Open Questions

- **Q1 Default switch state.** `configuring.html` 48-51 says notifications are disabled by default. The descriptor excerpt it quotes (145-157) shows `true`, and the real `ejb-jar.xml` values (417, 507, 593) are redacted in this snapshot. A human must choose the shipped default. The spec deliberately leaves it unstated.
- **Q2 Failed sends.** Should the rebuild keep fire-and-forget, or add retry, dead-lettering or an operator alert?
- **Q3 Shipment line data.** Confirm that the supplier invoice carries category, product and unit price, or that they should be joined from the order.
- **Q4 Recipient format.** Should the recipient address be validated, and should more than one recipient be allowed?
- **Q5 zh_CN currency.** The zh_CN shipment and completed-order templates format prices with `$` and two decimals, like en_US. ja_JP uses `￥` with no decimals. Is this intended, or a copy-paste error?
- **Q6 Switch naming.** The legacy `SendConfirmationMail` switch controls shipment mail, but its code comment says "when an order is completed". The rebuild names the switches by kind (approval, shipment, completed).

## Sprint planning — SWHR-S-0016

This section was added at sprint planning (SWHR-T-0155). The sections above describe the change as extracted from the legacy system. This section describes the repository as it stands on sprint base `f385275` (SWHR-S-0015 landed) and fixes the interfaces the five tickets code against. Where this section and D1–D7 disagree, this section wins, and the disagreement is listed under Spec discrepancies. The canvas's "Technical Approach" (a `mail_requests` table, producers called from approval and fulfilment code, `runtimeConfig` switches) predates this investigation and is superseded here.

### Codebase findings

| Change asks for                     | Already in the repo                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A durable queue (D1, 1.1, 1.2, 2.4) | `lib/messaging/outbox.ts`: one SQLite outbox, fixed subscribers per channel, one delivery row per subscriber. `lib/messaging/dispatcher.ts` `dispatchPending` retries a failed handler until `OUTBOX_MAX_ATTEMPTS`, then marks it `dead`. `plugins/outbox-dispatcher.ts` polls every `OUTBOX_POLL_MS`, with no guard against overlapping passes.                         |
| Triggers (4.1–4.3)                  | Subscriber `customer-notification` is already listed on `opc.approval-notice` (one `OrderApproval` document per batch, from `applyApprovalBatch`), `opc.invoice` (partner invoice XML: order id plus item id and quantity per line) and `opc.completed-order` (payload: the order id). No handler is registered, so every delivery since SWHR-S-0012 is still `pending`. |
| Order data                          | `getStoredOrder(orderId, tx)` in `lib/orders/store.ts`: `emailId` (never empty — checkout refuses an order without e-mail and intake requires `EmailId`), `locale`, and lines with `categoryId`, `productId`, `itemId`, `quantity`, `unitPrice` in integer minor units (`minorToDecimal`, `lib/orders/money.ts`).                                                        |
| Templates (3.1–3.4)                 | `lib/email/` from localization (SWHR-R-0018, SWHR-R-0019): `renderCustomerEmail(kind, order)` picks the template by locale, and `formatEmailPrice` does the price formats. The three templates are plain-text stubs with other subjects and a `name` field, and no category or product columns.                                                                          |
| Configuration                       | Operator settings follow `configs/signon-config.json` (JSON file, path overridable by environment, read at start). There is no SMTP library in `package.json`.                                                                                                                                                                                                           |
| CI                                  | `.github/workflows/ci.yml` runs on pushes and pull requests to `vortex/**`, `dev`, `main`: doc links, typecheck, lint, unit, build, Playwright.                                                                                                                                                                                                                          |

### Decisions (fixed interfaces)

Every signature below is a contract between tickets. A ticket that needs to change one escalates to planning instead.

- **P1 — Mail requests ride the outbox (SWHR-T-0158).** A new channel `mail.request` with the single subscriber `mailer` in `lib/messaging/outbox.ts` (`Channel` type and `SUBSCRIBERS`). No new table and no migration; tasks 1.1 and 1.2 are met by the outbox tables (SD-1).
- **P2 — Configuration (SWHR-T-0158).** New `lib/notifications/config.ts`:
  - `interface NotificationSwitches { approval: boolean; shipment: boolean; completed: boolean }`, read from the keys `sendApprovalMail`, `sendShipmentMail` and `sendCompletedOrderMail`.
  - `class NotificationConfigError extends Error`, whose message names the offending switch or setting.
  - `parseNotificationSwitches(raw: unknown): NotificationSwitches` accepts only JSON booleans, and throws for a missing or non-boolean key.
  - `loadNotificationSwitches(filePath?: string): NotificationSwitches` reads `NOTIFICATION_CONFIG_PATH`, else `configs/notification-config.json` from `process.cwd()`. A missing or unparseable file throws `NotificationConfigError`.
  - `interface MailSettings { from: string; host: string; port: number; user?: string; password?: string }` and `getMailSettings(env = process.env): MailSettings` from `MAIL_FROM` (default `customerservice@javapetstoredemo.com`), `SMTP_HOST` (default `localhost`), `SMTP_PORT` (default 25, a non-integer throws), `SMTP_USER` and `SMTP_PASSWORD`.
  - `configs/notification-config.json` ships all three switches `true` (SD-6).
  - `plugins/customer-notification.ts` calls `loadNotificationSwitches()` at start, so a bad file stops the server (D5). SWHR-T-0161 extends the same plugin.
- **P3 — Mail request and sender (SWHR-T-0160).**
  - `lib/messaging/errors.ts`: `class NonRetryableError extends Error`. `dispatchPending` marks a delivery `dead` on its first attempt when the handler throws one; other errors retry as before. `dispatchPending(opts?: { now?: Date; only?: readonly Channel[]; except?: readonly Channel[] })` filters due deliveries by channel.
  - `lib/notifications/mailRequest.ts`: `interface MailRequest { recipient: string; subject: string; body: string }`. `class MailRequestValidationError extends NonRetryableError`. `parseMailRequest(payload: string): MailRequest` accepts only a JSON object whose keys are exactly `recipient`, `subject`, `body` in that order, each a non-empty string. `enqueueMail(tx: Tx, request: MailRequest): string` validates, then enqueues on `mail.request`.
  - `lib/notifications/transport.ts`: `interface OutgoingEmail { from: string; to: string; subject: string; html: string; date: Date }`. `interface MailTransport { send(email: OutgoingEmail): Promise<void> }`. `createSmtpTransport(settings: MailSettings): MailTransport` uses nodemailer (new dependency), sends the HTML as UTF-8, sets the `Date` header from `email.date`, and bounds connection and socket waits.
  - `lib/notifications/mailer.ts`: `createMailerHandler(deps: { transport: MailTransport; from: string; now?: () => Date; log?: (message: string, error: unknown) => void }): Handler`. A malformed request throws `MailRequestValidationError`, so nothing is sent and the delivery ends `dead`. A valid request is sent once, From `deps.from`, dated `now()`. A send that throws is logged and the handler returns normally, so the delivery ends `delivered` and is not retried (D3, SD-2).
  - `plugins/mail-sender.ts` registers `mailer` on `mail.request` with `createSmtpTransport(getMailSettings())`, then polls `dispatchPending({ only: ["mail.request"] })`. `plugins/outbox-dispatcher.ts` polls `dispatchPending({ except: ["mail.request"] })`. A slow mail server therefore never holds up order processing (SWHR-R-0239). Neither poller starts a pass while its previous pass is still running, so no request is sent twice. Both stay inactive under Vitest, as today.
- **P4 — Templates (SWHR-T-0159).** In `lib/email/`:
  - `EmailOrderLine { categoryId: string; productId: string; itemId: string; quantity: number; unitPrice: number }`, where `unitPrice` is the decimal amount in the order's currency.
  - `EmailOrder { orderId: string; locale: string; lines: EmailOrderLine[]; decision?: "APPROVED" | "DENIED" }`.
  - `RenderedEmail` keeps its shape, and `body` is now HTML. `renderCustomerEmail(kind, order)` keeps its signature and locale selection (SWHR-R-0018).
  - Subjects are `Java Pet Store Order Status: <id>`, `Java Pet Store Order Shipped: <id>` and `Java Pet Store Order COMPLETED: <id>` in every locale (SD-3).
  - Each body is one self-contained HTML document with inline styles only. It follows the mockup message (see Design reference): heading, thanks, order id, the decision or shipped statement, the Category / Product # / Quantity / Unit Price table for shipment and completed, and the closing thanks and footer. The en_US wording is the mockups' text verbatim. ja_JP and zh_CN carry translated equivalents (SD-4). Every interpolated value is HTML-escaped. Prices use `formatEmailPrice` unchanged (SD-8).
- **P5 — Producers (SWHR-T-0161).** New `lib/notifications/producers.ts`, each factory taking `NotificationSwitches` and returning a `Handler`:
  - `createApprovalNoticeHandler(switches)` for `opc.approval-notice`: `readOrderApproval(payload)`, then one approval e-mail per entry, with `decision` set to the entry's status.
  - `createShipmentNoticeHandler(switches)` for `opc.invoice`: `readPartnerInvoice(payload)`. The rows are the order lines whose item id the invoice ships, with the invoiced quantity and the line's unit price (SD-7). If no line matches, nothing is sent.
  - `createCompletedNoticeHandler(switches)` for `opc.completed-order`: every order line at its ordered quantity.
  - Each renders with `renderCustomerEmail` and calls `enqueueMail(tx, { recipient: order.emailId, subject, body })` in its commit step.
  - A switched-off kind returns a no-op commit, which consumes the trigger (SWHR-R-0237). An unknown order throws, so the dispatcher retries and eventually marks the delivery dead.
  - `plugins/customer-notification.ts` registers the three as consumer `customer-notification`, with the switches loaded at start. `lib/orders/approval.ts` and `lib/orders/invoice.ts` do not change (SD-10).
- **P6 — Order of work.** SWHR-T-0158 and SWHR-T-0159 start in parallel. SWHR-T-0160 waits for SWHR-T-0158. SWHR-T-0161 waits for SWHR-T-0159 and SWHR-T-0160. SWHR-T-0162 waits for SWHR-T-0161. Ownership maps in each PLAN.md are disjoint, except `plugins/customer-notification.ts`, which SWHR-T-0158 creates and SWHR-T-0161 extends after it.

### Design reference

Exported byte-exact from idea SWHR-I-0013, doc v12, to `artifacts/SWHR-S-0016/design/` (index `MANIFEST.md`): a wireframe and a mockup each for the approved and denied approval e-mails, the shipment e-mail and the completed-order e-mail. The mockups' mail-client frame (subject, From, To, Date) is not part of the body.

### Spec discrepancies

These are recorded as observed. Nothing in the delta spec was edited.

- **SD-1 — A second queue.** D1 adds a mail outbox table. ARCHITECTURE's Key Decision "One outbox for every asynchronous hop" forbids a second queue, and the outbox already persists across restarts. P1 adds a channel instead, and tasks 1.1 and 1.2 need no table or migration.
- **SD-2 — Malformed and failed sends on a retrying outbox.** The dispatcher retries every failure, but D2 says a malformed request is never redelivered, and SWHR-R-0243 says a failed send is not retried. P3 adds `NonRetryableError`, so a malformed request is dead at once and never acknowledged as delivered (SWHR-R-0240). A failed send is logged and consumed.
- **SD-3 — Translated subjects.** SWHR-R-0244 says the "subject line identifier" follows the order's locale; SWHR-R-0233 to SWHR-R-0235 fix English subjects. The canvas leaves this open. The subjects stay English in every locale, and the identifier is the order id. A human may still ask for translated subjects.
- **SD-4 — Japanese and Chinese wording.** The spec gives English wording only, and the legacy stylesheets are not in the repository. The implementation writes translated equivalents, which a human should sign off. The existing ja_JP and zh_CN subjects in `lib/email/` are replaced.
- **SD-5 — Order with no e-mail address.** The canvas asks what happens. It cannot occur: checkout refuses an order without an address and intake requires `EmailId`. The recipient is `emailId`, and a blank one would still fail validation.
- **SD-6 — Default switch state (Q1).** PRODUCT assumption 6 says the replacement ships the notifications on. The committed config sets all three to `true`; a missing key still stops start-up.
- **SD-7 — Shipment line data (Q3).** The partner invoice carries only item id and quantity. Category, product and unit price are joined from the stored order lines by item id.
- **SD-8 — zh_CN currency (Q5).** Localization SWHR-R-0019, in the spec of record, requires `$#,##0.00` for zh_CN, so it stays.
- **SD-9 — Existing templates.** The localization templates are plain text with subjects like "Your order has shipped". They are rewritten as HTML with the spec's subjects, and localization's template-selection and price scenarios must still pass.
- **SD-10 — Where producers run.** The canvas has the approval and fulfilment code call the producers in their own transaction. The repo already routes these triggers to a `customer-notification` subscriber, and the trigger message is enqueued in the status-change transaction, so it is just as durable. P5 uses the subscribers and leaves order processing untouched.
- **SD-11 — Stack line.** Context names better-sqlite3; the repo uses `bun:sqlite` through drizzle. Nothing changes.
- **SD-12 — Brand.** Subjects say "Java Pet Store" (spec), and the mockup heading says "Pet Store". Both are kept as drawn, pending the canvas's branding question.

### Phases

1. **Configuration and channel** (SWHR-T-0158). Switches, mail settings, the `mail.request` channel, fail-fast start-up.
2. **Mail request and sender** (SWHR-T-0160). Validation, SMTP transport, mailer consumer, non-retryable failure, split pollers.
3. **Templates** (SWHR-T-0159). HTML bodies in three locales, spec subjects, escaping.
4. **Producers** (SWHR-T-0161). The three `customer-notification` consumers and their switch gating.
5. **Test harness** (SWHR-T-0162, plus each ticket's own tests). Every approved case SWHR-C-0001 and SWHR-C-0413 to SWHR-C-0430 gets a citing test in the ticket that owns its scenario. Unit cases (C-0419, C-0421 to C-0425, C-0428 to C-0430) run in the Vitest `server` project, because `lib/**` and `plugins/**` run there. Integration cases use the in-memory database, drive delivery through `dispatchPending`, and replace SMTP with a capturing `MailTransport`; no real mail server is needed. SWHR-T-0162 adds the lifecycle, slow-server and server-down scenarios, and a coverage test with the case ids written into it. It does not read `test-cases.md`, which moves at archive. There is no screen, so no Playwright spec is added. The E2E web server boots with the committed config, which exercises the start-up check.
6. **CI.** No workflow change. `ci.yml` already triggers on `vortex/**` and runs the unit and Playwright suites. The new tests land in those jobs by path, and nodemailer installs with the lockfile.

### Risks

- The first deploy flushes the backlog. Every order since SWHR-S-0012 has pending `customer-notification` deliveries, so each of those customers gets their old notices at once. The operator can switch a kind off before deploying to consume them silently.
- Polling passes can overlap. A pass is async and the timer does not wait for it, so a slow send could be picked up twice. P3's no-overlap guard is required, not optional.
- `lib/email` changes shape. `lib/email/render.test.ts` fixtures change to the new line fields. Its assertions must keep their meaning.
- No local SMTP. Dev and E2E sends to `localhost:25` fail and are logged. That is the specified behaviour, not a defect.
