import { definePlugin } from "nitro";

import { dispatchPending } from "../lib/messaging/dispatcher";
import { registerConsumer } from "../lib/messaging/outbox";
import { getMailSettings } from "../lib/notifications/config";
import { createMailerHandler } from "../lib/notifications/mailer";
import { createSmtpTransport } from "../lib/notifications/transport";

const DEFAULT_POLL_MS = 1000;

function pollIntervalMs(): number {
  const configured = Number(process.env.OUTBOX_POLL_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_POLL_MS;
}

/**
 * Registers the `mailer` consumer and polls only `mail.request` on its own
 * timer, so a slow mail server never delays order processing. A tick is
 * skipped while the previous pass is still running, so no request is sent
 * twice. Polling is inactive under Vitest.
 */
export default definePlugin(() => {
  const settings = getMailSettings();
  registerConsumer(
    "mail.request",
    "mailer",
    createMailerHandler({ transport: createSmtpTransport(settings), from: settings.from }),
  );

  if (process.env.VITEST) {
    return;
  }

  let running = false;
  setInterval(() => {
    if (running) {
      return;
    }
    running = true;
    dispatchPending({ only: ["mail.request"] })
      .catch((error) => {
        console.error("mail dispatch failed", error);
      })
      .finally(() => {
        running = false;
      });
  }, pollIntervalMs());
});
