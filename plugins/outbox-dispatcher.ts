import { definePlugin } from "nitro";

import { dispatchPending } from "../lib/messaging/dispatcher";

const DEFAULT_POLL_MS = 1000;

function pollIntervalMs(): number {
  const configured = Number(process.env.OUTBOX_POLL_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_POLL_MS;
}

/**
 * Polls the outbox on a timer so a message enqueued outside a request
 * (or one left `pending` after a failed attempt) still gets delivered
 * (design.md P4). Inactive under Vitest — tests call `dispatchPending`
 * directly rather than racing a background timer.
 */
export default definePlugin(() => {
  if (process.env.VITEST) {
    return;
  }

  setInterval(() => {
    dispatchPending().catch((error) => {
      console.error("outbox dispatch failed", error);
    });
  }, pollIntervalMs());
});
