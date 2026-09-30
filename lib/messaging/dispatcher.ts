import { and, eq, lte } from "drizzle-orm";

import { db } from "../../db/client";
import { outboxDeliveries, outboxMessages } from "../../db/schema";
import { NonRetryableError } from "./errors";
import { type Channel, getConsumer } from "./outbox";

const DEFAULT_MAX_ATTEMPTS = 10;
// Linear backoff (attempts * 1s) — design.md P4 leaves the exact delay
// open ("schedules a retry"); this is deterministic and cheap to test via
// the injectable `now`.
const RETRY_DELAY_MS = 1000;

function maxAttempts(): number {
  const configured = Number(process.env.OUTBOX_MAX_ATTEMPTS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_ATTEMPTS;
}

/**
 * Runs every due delivery once. A delivery with no registered consumer
 * handler is left untouched (still pending, design.md P4 — nothing is
 * lost before a consumer exists). Success: the handler's prepare step runs
 * first (outside any transaction — a throw here leaves the database
 * completely untouched), then its commit step runs together with marking
 * the delivery `delivered` inside one `db.transaction()`, so a throw from
 * the commit rolls back everything it did, including the delivered mark.
 * Failure (either phase): a *separate* write (the failed transaction is
 * already rolled back) increments `attempts`, records `lastError`, and
 * either reschedules `nextAttemptAt` or marks the delivery `dead` past
 * `OUTBOX_MAX_ATTEMPTS`; a `NonRetryableError` marks it `dead` at once.
 * `only` / `except` restrict the pass by channel.
 */
export async function dispatchPending(opts?: {
  now?: Date;
  only?: readonly Channel[];
  except?: readonly Channel[];
}): Promise<{ delivered: number; failed: number }> {
  const now = opts?.now ?? new Date();
  let delivered = 0;
  let failed = 0;

  const due = db
    .select({
      deliveryId: outboxDeliveries.id,
      consumer: outboxDeliveries.consumer,
      attempts: outboxDeliveries.attempts,
      channel: outboxMessages.channel,
      payload: outboxMessages.payload,
    })
    .from(outboxDeliveries)
    .innerJoin(outboxMessages, eq(outboxDeliveries.messageId, outboxMessages.id))
    .where(and(eq(outboxDeliveries.status, "pending"), lte(outboxDeliveries.nextAttemptAt, now)))
    .all();

  for (const row of due) {
    const channel = row.channel as Channel;
    if (opts?.only && !opts.only.includes(channel)) {
      continue;
    }
    if (opts?.except?.includes(channel)) {
      continue;
    }
    const handler = getConsumer(channel, row.consumer);
    if (!handler) {
      continue;
    }

    try {
      const commit = await handler(row.payload);
      db.transaction((tx) => {
        commit(tx);
        tx.update(outboxDeliveries)
          .set({ status: "delivered" })
          .where(eq(outboxDeliveries.id, row.deliveryId))
          .run();
      });
      delivered++;
    } catch (error) {
      const attempts = row.attempts + 1;
      const dead = error instanceof NonRetryableError || attempts >= maxAttempts();
      db.update(outboxDeliveries)
        .set({
          attempts,
          lastError: error instanceof Error ? error.message : String(error),
          status: dead ? "dead" : "pending",
          nextAttemptAt: new Date(now.getTime() + RETRY_DELAY_MS * attempts),
        })
        .where(eq(outboxDeliveries.id, row.deliveryId))
        .run();
      failed++;
    }
  }

  return { delivered, failed };
}
