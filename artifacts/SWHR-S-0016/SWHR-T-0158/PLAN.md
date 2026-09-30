# PLAN — SWHR-T-0158: Data model and configuration (task group 1)

Change: `swhr-i-0013-customer-notifications`. Read its `design.md` §"Sprint planning — SWHR-S-0016" first (P1, P2, SD-1, SD-6). Requirement: **Missing or invalid notification switch fails fast**. Also provides the configuration for **Independently switchable notification kinds** and **Configured sender and mail server**.

## Design reference

No design blocks apply: this ticket renders nothing. The e-mail designs are SWHR-T-0159's (`artifacts/SWHR-S-0016/design/`).

## Objective

Give the rest of the sprint a `mail.request` channel, validated notification switches and mail settings, and a server that refuses to start on a bad switch.

## Steps

1. P1: add `mail.request` → `["mailer"]` to `Channel` and `SUBSCRIBERS` in `lib/messaging/outbox.ts`. Extend `lib/messaging/channels.test.ts` so `resolveChannel("mail.request")` resolves. No schema change, and nothing in `drizzle/` (SD-1 covers tasks 1.1 and 1.2).
2. Write `lib/notifications/config.test.ts` first. Cite SWHR-C-0419 on the test where `sendCompletedOrderMail` is absent: loading throws `NotificationConfigError` naming it. Add tests for a string `"true"`, a number and `null` being refused and naming the key; a missing file and invalid JSON refused; the committed file loading as all `true`; `getMailSettings({})` defaults; `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT` overrides; `SMTP_PORT=abc` refused.
3. Implement `lib/notifications/config.ts` per P2. Mirror `lib/auth/protection.ts` for reading a `configs/` file with an environment path override.
4. Add `configs/notification-config.json` with the three keys set to `true`.
5. Create `plugins/customer-notification.ts`: a `definePlugin` that calls `loadNotificationSwitches()`. Add `plugins/customer-notification.test.ts`, shaped like `plugins/order-fulfillment.test.ts`: with `NOTIFICATION_CONFIG_PATH` pointing to a temp file missing a switch, invoking the plugin throws the naming error; with the committed file it does not throw.

## File/module ownership

- modify `lib/messaging/outbox.ts`, `lib/messaging/channels.test.ts`
- new `lib/notifications/config.ts`, `lib/notifications/config.test.ts`
- new `configs/notification-config.json`
- new `plugins/customer-notification.ts`, `plugins/customer-notification.test.ts` (SWHR-T-0161 extends both afterwards)

## Definition of Done

AC-1 to AC-5 of the ticket.
