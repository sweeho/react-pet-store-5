# SWHR-T-0158 summary

Added the `mail.request` outbox channel (subscriber `mailer`), validated notification switches and mail settings, and a start-up plugin that stops the server on a bad switch. No table or migration. No UI, so no design applied.

Files: `lib/messaging/outbox.ts`, `lib/messaging/channels.test.ts`, `lib/notifications/config.ts` (+test), `configs/notification-config.json` (all `true`), `plugins/customer-notification.ts` (+test).

AC coverage: fail-fast on missing/non-boolean switch and unreadable file (config + plugin tests); mail defaults, overrides and integer-port check (`getMailSettings` tests); committed config starts the app.

Verification: `bun run verify` exit 0, 1022 tests passed. Platform red/green runs could not be recorded (MCP transport dropped on `a2a_run_tests`); local red was 19 failed before implementation.
