import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { outboxDeliveries, outboxMessages } from "../../../db/schema";
import { dispatchPending } from "../../messaging/dispatcher";
import { registerConsumer } from "../../messaging/outbox";
import type { ContactInfo } from "../elements/contactInfo";
import { sendSupplierPurchaseOrders } from "./supplierChannel";

const CONTACT: ContactInfo = {
  familyName: "Doe",
  givenName: "Jane",
  address: {
    streetName1: "1 Main St",
    streetName2: null,
    city: "Springfield",
    state: "IL",
    zipCode: "62701",
    country: "USA",
  },
  email: "jane@example.com",
  phone: "555-1234",
};

const LINE_ITEMS = [
  { categoryId: "c", productId: "p", itemId: "i1", lineNum: 1, quantity: 1, unitPrice: "19.99" },
];

beforeEach(() => {
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
});

describe("sendSupplierPurchaseOrders", () => {
  /** SWHR-R-0049.01 */
  it("[SWHR-C-0093] delivers two separate supplier purchase order messages for two approved orders", async () => {
    const received: string[] = [];
    registerConsumer("supplier.purchase-order", "supplier-intake", async (payload) => () => {
      received.push(payload);
    });

    db.transaction((tx) => {
      sendSupplierPurchaseOrders(tx, [
        {
          orderId: "ORD-1",
          orderDate: new Date(2002, 2, 15),
          shippingInfo: CONTACT,
          lineItems: LINE_ITEMS,
        },
        {
          orderId: "ORD-2",
          orderDate: new Date(2002, 2, 15),
          shippingInfo: CONTACT,
          lineItems: LINE_ITEMS,
        },
      ]);
    });

    const messages = db.select().from(outboxMessages).all();
    expect(messages).toHaveLength(2);
    expect(messages.every((m) => m.channel === "supplier.purchase-order")).toBe(true);

    await dispatchPending();
    expect(received).toHaveLength(2);
    expect(received.some((xml) => xml.includes("ORD-1"))).toBe(true);
    expect(received.some((xml) => xml.includes("ORD-2"))).toBe(true);
  });

  it("creates one delivery row per message (single subscriber, point-to-point)", () => {
    db.transaction((tx) => {
      sendSupplierPurchaseOrders(tx, [
        {
          orderId: "ORD-3",
          orderDate: new Date(2002, 2, 15),
          shippingInfo: CONTACT,
          lineItems: LINE_ITEMS,
        },
      ]);
    });

    const messageId = db.select().from(outboxMessages).all()[0]!.id;
    const deliveries = db
      .select()
      .from(outboxDeliveries)
      .where(eq(outboxDeliveries.messageId, messageId))
      .all();
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]!.consumer).toBe("supplier-intake");
  });
});
