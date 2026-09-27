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
