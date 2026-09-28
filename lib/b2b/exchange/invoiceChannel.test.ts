import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { outboxDeliveries, outboxMessages } from "../../../db/schema";
import { dispatchPending } from "../../messaging/dispatcher";
import { registerConsumer } from "../../messaging/outbox";
import type { PartnerInvoice } from "../partner/tpaInvoice";
import { publishInvoices } from "./invoiceChannel";

const LINE_ITEMS = [
  { categoryId: "c", productId: "p", itemId: "i1", lineNum: 1, quantity: 1, unitPrice: "19.99" },
];

function invoiceFor(orderId: string): PartnerInvoice {
  return {
    orderId,
    userId: "j2ee",
    orderDate: new Date(2002, 2, 15),
    shippingDate: new Date(2002, 2, 16),
    lineItems: LINE_ITEMS,
  };
}

beforeEach(() => {
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
});

describe("publishInvoices", () => {
  /** SWHR-R-0049.02 */
  it("[SWHR-C-0094] fans one published invoice out so fulfilment and notification each get their own copy", async () => {
    const fulfilment: string[] = [];
    const notification: string[] = [];
    registerConsumer("opc.invoice", "order-fulfillment", async (payload) => () => {
      fulfilment.push(payload);
    });
    registerConsumer("opc.invoice", "customer-notification", async (payload) => () => {
      notification.push(payload);
    });

    db.transaction((tx) => publishInvoices(tx, [invoiceFor("ORD-1")]));

    await dispatchPending();

    expect(fulfilment).toHaveLength(1);
    expect(notification).toHaveLength(1);
    expect(fulfilment[0]).toBe(notification[0]);
  });

  /** SWHR-R-0051.01 */
  it("[SWHR-C-0097] publishes two invoice messages when two pending orders ship (stock arrival)", () => {
    db.transaction((tx) => {
      publishInvoices(tx, [invoiceFor("ORD-A"), invoiceFor("ORD-B")]);
    });

    const messages = db.select().from(outboxMessages).all();
    expect(messages).toHaveLength(2);
    expect(messages.every((m) => m.channel === "opc.invoice")).toBe(true);
    expect(messages.some((m) => m.payload.includes("ORD-A"))).toBe(true);
    expect(messages.some((m) => m.payload.includes("ORD-B"))).toBe(true);
  });
});
