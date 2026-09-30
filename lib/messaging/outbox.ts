import { randomUUID } from "node:crypto";

import { db } from "../../db/client";
import { outboxDeliveries, outboxMessages } from "../../db/schema";

export type Channel =
  | "supplier.purchase-order"
  | "opc.invoice"
  | "opc.purchase-order"
  | "opc.order-approval"
  | "opc.approval-notice"
  | "opc.completed-order"
  | "mail.request";
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Handler = (payload: string) => Promise<(tx: Tx) => void>;

// Fixed subscriber lists (design.md P4): a message gets one delivery row
// per subscriber at enqueue time, so nothing is lost before a consumer for
// it exists (SD-3) — an unregistered consumer's delivery just stays
// pending.
const SUBSCRIBERS: Record<Channel, readonly string[]> = {
  "supplier.purchase-order": ["supplier-intake"],
  "opc.invoice": ["order-fulfillment", "customer-notification"],
  "opc.purchase-order": ["order-intake"],
  "opc.order-approval": ["order-approval"],
  "opc.approval-notice": ["customer-notification"],
  "opc.completed-order": ["customer-notification"],
  "mail.request": ["mailer"],
};

/** Every channel the outbox knows, for `resolveChannel`'s default registry. */
export const CHANNELS: readonly Channel[] = Object.keys(SUBSCRIBERS) as Channel[];

const consumers = new Map<string, Handler>();

function consumerKey(channel: Channel, consumer: string): string {
  return `${channel}:${consumer}`;
}

/**
 * Enqueues `payload` on `channel` inside the caller's own transaction, and
 * creates one `outboxDeliveries` row per fixed subscriber. Returns the new
 * message id.
 */
export function enqueue(tx: Tx, channel: Channel, payload: string): string {
  const id = randomUUID();
  const now = new Date();

  tx.insert(outboxMessages).values({ id, channel, payload, createdAt: now }).run();

  for (const consumer of SUBSCRIBERS[channel]) {
    tx.insert(outboxDeliveries)
      .values({ messageId: id, consumer, status: "pending", attempts: 0, nextAttemptAt: now })
      .run();
  }

  return id;
}

export function registerConsumer(channel: Channel, consumer: string, handler: Handler): void {
  consumers.set(consumerKey(channel, consumer), handler);
}

/** `undefined` when no handler is registered for this channel/consumer pair. */
export function getConsumer(channel: Channel, consumer: string): Handler | undefined {
  return consumers.get(consumerKey(channel, consumer));
}
