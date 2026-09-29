import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { outboxDeliveries, outboxMessages } from "../../db/schema";
import { enqueue, getConsumer, registerConsumer } from "./outbox";

beforeEach(() => {
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
});

describe("enqueue", () => {
  it("creates the message and one delivery row per fixed subscriber for supplier.purchase-order", () => {
    const id = db.transaction((tx) => enqueue(tx, "supplier.purchase-order", "payload-a"));

    const message = db.select().from(outboxMessages).where(eq(outboxMessages.id, id)).get();
    expect(message).toMatchObject({ channel: "supplier.purchase-order", payload: "payload-a" });

    const deliveries = db
      .select()
      .from(outboxDeliveries)
      .where(eq(outboxDeliveries.messageId, id))
      .all();
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]).toMatchObject({
      consumer: "supplier-intake",
      status: "pending",
      attempts: 0,
    });
  });

  it("creates two delivery rows (fan-out) for opc.invoice", () => {
    const id = db.transaction((tx) => enqueue(tx, "opc.invoice", "payload-b"));

    const deliveries = db
      .select()
      .from(outboxDeliveries)
      .where(eq(outboxDeliveries.messageId, id))
      .all();
    expect(deliveries.map((d) => d.consumer).sort()).toEqual([
      "customer-notification",
      "order-fulfillment",
    ]);
  });

  it.each([
    ["opc.order-approval", "order-approval"],
    ["opc.approval-notice", "customer-notification"],
    ["opc.completed-order", "customer-notification"],
  ] as const)("creates one delivery for %s", (channel, consumer) => {
    const id = db.transaction((tx) => enqueue(tx, channel, "payload"));
    const deliveries = db
      .select()
      .from(outboxDeliveries)
      .where(eq(outboxDeliveries.messageId, id))
      .all();
    expect(deliveries.map((d) => d.consumer)).toEqual([consumer]);
  });

  it("rolls back the message and deliveries when the caller's transaction throws", () => {
    expect(() =>
      db.transaction((tx) => {
        enqueue(tx, "opc.invoice", "rolled-back");
        throw new Error("boom");
      }),
    ).toThrow("boom");

    expect(db.select().from(outboxMessages).all()).toHaveLength(0);
    expect(db.select().from(outboxDeliveries).all()).toHaveLength(0);
  });
});

describe("registerConsumer / getConsumer", () => {
  it("returns the registered handler for a channel/consumer pair", () => {
    const handler = async () => () => {};
    registerConsumer("supplier.purchase-order", "test-consumer-a", handler);

    expect(getConsumer("supplier.purchase-order", "test-consumer-a")).toBe(handler);
  });

  it("returns undefined for an unregistered consumer", () => {
    expect(getConsumer("opc.invoice", "test-consumer-never-registered")).toBeUndefined();
  });
});
