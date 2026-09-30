# PLAN — SWHR-T-0160: Mail request and sender (task group 2)

Change: `swhr-i-0013-customer-notifications`. Read its `design.md` §"Sprint planning — SWHR-S-0016" first (P3, SD-2, Risks). Requirements: **Mail request structure and validation**, **Outgoing email format**, **Configured sender and mail server**, and the sender side of **Asynchronous email delivery** and **Send failure handling**.

## Design reference

No design blocks apply: the sender sends whatever HTML the request carries. The e-mail designs are SWHR-T-0159's (`artifacts/SWHR-S-0016/design/`).

## Objective

Turn a queued mail request into exactly one e-mail, from the configured sender. A malformed request is never sent, and a failed send is never retried. Mail runs on its own poller, so a slow server never delays order processing.

## Steps

1. Dispatcher first. In `lib/messaging/errors.ts`, add `NonRetryableError`. In `lib/messaging/dispatcher.ts`, add `only` and `except` to the options, and mark a delivery `dead` on its first attempt when the handler throws a `NonRetryableError`. Extend `dispatcher.test.ts`: a non-retryable failure is dead after one attempt and not run on the next pass; an ordinary failure still reschedules; `only` and `except` select by channel.
2. Write `lib/notifications/mailRequest.test.ts` first. Cite SWHR-C-0421 for a request with no subject: `parseMailRequest` throws `MailRequestValidationError`. Add tests for a non-JSON payload, an empty field, an extra or out-of-order key, and `enqueueMail` refusing an invalid request and enqueuing a valid one on `mail.request`. Implement `mailRequest.ts`.
3. Write `lib/notifications/mailer.test.ts` with a capturing `MailTransport`:
   - SWHR-C-0421: the malformed request's delivery ends `dead` and nothing is captured. Drive it through `enqueue` and `dispatchPending`.
   - SWHR-C-0422: a well-formed request produces exactly one captured e-mail with its subject and body.
   - SWHR-C-0423: To `ann@example.com`, subject `S`, html `<b>hello</b>`, date 2026-09-26T10:00:00Z from an injected `now`.
   - SWHR-C-0424: From is the `getMailSettings({})` default.
   - SWHR-C-0425: From is `orders@shop.example` from `MAIL_FROM`.
   - A throwing transport: the error is logged, the delivery ends `delivered`, and the next pass sends nothing.
     Implement `mailer.ts`.
4. Implement `lib/notifications/transport.ts` with nodemailer. Add `nodemailer` and `@types/nodemailer` to `package.json` and the lockfile. In a unit test, prove UTF-8 and the `Date` header by sending through nodemailer's `jsonTransport`/`streamTransport` and reading the built message. Keep the SMTP options: host, port, auth only when a user is set, and bounded connection and socket timeouts.
5. Create `plugins/mail-sender.ts`. It registers `mailer` on `mail.request` with `createSmtpTransport(getMailSettings())`. Outside Vitest it polls `dispatchPending({ only: ["mail.request"] })` every `OUTBOX_POLL_MS`, skipping a tick while the previous pass is still running. Change `plugins/outbox-dispatcher.ts` to `except: ["mail.request"]` with the same guard. Test both plugins in the shape of `plugins/outbox-dispatcher.test.ts`.

## File/module ownership

- modify `lib/messaging/errors.ts`, `lib/messaging/errors.test.ts`, `lib/messaging/dispatcher.ts`, `lib/messaging/dispatcher.test.ts`
- modify `plugins/outbox-dispatcher.ts`, `plugins/outbox-dispatcher.test.ts`
- new `plugins/mail-sender.ts`, `plugins/mail-sender.test.ts`
- new `lib/notifications/mailRequest.ts`, `mailRequest.test.ts`, `transport.ts`, `transport.test.ts`, `mailer.ts`, `mailer.test.ts`
- modify `package.json`, `bun.lock` (nodemailer)

## Definition of Done

AC-1 to AC-9 of the ticket.
