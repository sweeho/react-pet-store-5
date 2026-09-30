# TDD result — SWHR-T-0160

## Test cases

- SWHR-C-0421 (no subject: rejected, never sent, delivery dead): `lib/notifications/mailRequest.test.ts`, `mailer.test.ts`.
- SWHR-C-0422 one email with subject and body, 0423 To/subject/HTML/date, 0424 default From, 0425 configured From: `lib/notifications/mailer.test.ts`.
- Uncited: `transport.test.ts` (UTF-8 and Date header via nodemailer streamTransport), dispatcher `only`/`except`/non-retryable tests, `errors.test.ts`, both plugin tests (overlap guard, channel split).

## Notes

- Red run id: 48a83801-6d7f-43cb-b49a-bd0ee8aeaed2 (commit 65d99d6; assertion and stub failures for all five cases). A first red attempt was invalid because package.json, bun.lock and errors.ts had changed; the red commit was rebuilt with stubs only.
- Green run id: bd462f48-d8de-4b03-86b5-1717bcf7fd90 (commit d088b42; all five pass).
- Full gate `bun run verify` (lint, typecheck, unit): exit 0, 202 files, 1058 tests passed.
