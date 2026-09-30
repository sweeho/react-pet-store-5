# SWHR-T-0160 summary

Added the validated mail request, the nodemailer SMTP transport and the `mailer` consumer, with a separate poller for `mail.request`.

- `lib/messaging`: `NonRetryableError`; `dispatchPending` takes `only`/`except` channel lists and marks a delivery `dead` on the first attempt for a `NonRetryableError`.
- `lib/notifications`: `mailRequest.ts` (strict parse: exact keys in order, non-empty strings; `enqueueMail` validates then enqueues), `transport.ts` (SMTP with bounded timeouts, auth only when a user is set; the transporter is injectable for tests), `mailer.ts` (malformed request throws non-retryable; a failed send is logged and consumed).
- `plugins/mail-sender.ts` registers `mailer` and polls only `mail.request`; `plugins/outbox-dispatcher.ts` now excludes it. Both skip a tick while the previous pass runs.
- `package.json`, `bun.lock`: nodemailer and @types/nodemailer.

Deviation: `createSmtpTransport(settings, transporter?)` gained an optional second parameter for testing; P3's one-argument call still works.

Verification: `bun run verify` exit 0 (1058 tests passed); recorded red and green runs for SWHR-C-0421 to 0425.
