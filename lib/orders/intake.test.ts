import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../db/client";
import { outboxDeliveries, outboxMessages, purchaseOrders } from "../../db/schema";
import { type PurchaseOrder, writePurchaseOrder } from "../b2b/documents/purchaseOrder";
import { dispatchPending } from "../messaging/dispatcher";
import * as outbox from "../messaging/outbox";
import { createOrderIntakeHandler } from "./intake";
import { getStoredOrder } from "./store";

const { enqueue, registerConsumer } = outbox;

beforeEach(() => {
  vi.restoreAllMocks();
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
  db.delete(purchaseOrders).run();
  registerConsumer("opc.purchase-order", "order-intake", createOrderIntakeHandler());
});

function order(orderId: string): PurchaseOrder {
  const contact = {
    familyName: "XYZ",
    givenName: "ABC",
    email: "abc@example.com",
    phone: "555-555-5555",
    address: {
      streetName1: "1 Main",
      streetName2: null,
      city: "Palo Alto",
      state: "California",
      zipCode: "94303",
      country: "United States",
    },
  };
  return {
    locale: "en_US",
    orderId,
    userId: "j2ee",
    emailId: "abc@example.com",
    orderDate: new Date("2026-01-02T03:04:05Z"),
    shippingInfo: contact,
    billingInfo: contact,
    totalPrice: "51.50",
    creditCard: { cardNumber: "•••• •••• •••• 4242", cardType: "Visa", expiryDate: "12/2030" },
    lineItems: [
      {
        categoryId: "FISH",
        productId: "FI-SW-01",
        itemId: "EST-1",
        lineNum: 1,
        quantity: 2,
        unitPrice: "20.00",
      },
    ],
  };
}

const send = (orderId: string) =>
  db.transaction((tx) => enqueue(tx, "opc.purchase-order", writePurchaseOrder(order(orderId))));

describe("order intake", () => {
  it("[SWHR-C-0271] a message enqueued in a rolled-back unit of work is not delivered", async () => {
    expect(() =>
      db.transaction((tx) => {
        enqueue(tx, "opc.purchase-order", writePurchaseOrder(order("ROLLED-BACK")));
        throw new Error("caller rolls back");
      }),
    ).toThrow("caller rolls back");
    send("COMMITTED");

    const result = await dispatchPending();

    expect(result).toEqual({ delivered: 1, failed: 0 });
    expect(getStoredOrder("COMMITTED")).not.toBeNull();
    expect(getStoredOrder("ROLLED-BACK")).toBeNull();
  });

  it("[SWHR-C-0272] an enqueue failure reaches the caller, aborts the unit of work and leaves no transaction open", async () => {
    vi.spyOn(outbox, "enqueue").mockImplementation(() => {
      throw new Error("queue unreachable");
    });
    expect(() =>
      db.transaction((tx) => {
        tx.insert(outboxMessages)
          .values({ id: "m", channel: "opc.purchase-order", payload: "x", createdAt: new Date() })
          .run();
        outbox.enqueue(tx, "opc.purchase-order", "x");
      }),
    ).toThrow("queue unreachable");
    expect(db.select().from(outboxMessages).all()).toHaveLength(0);
    vi.restoreAllMocks();

    // No transaction was left open: a following unit of work commits and delivers.
    send("AFTER-FAILURE");
    await dispatchPending();
    expect(getStoredOrder("AFTER-FAILURE")).not.toBeNull();
  });

  it("stores a committed order once and a redelivery is a no-op", async () => {
    send("ONCE");
    await dispatchPending();
    db.update(outboxDeliveries)
      .set({ status: "pending" })
      .where(eq(outboxDeliveries.consumer, "order-intake"))
      .run();
    await dispatchPending();

    expect(db.select().from(purchaseOrders).all()).toHaveLength(1);
  });

  it("does not mark a malformed payload delivered", async () => {
    db.transaction((tx) => enqueue(tx, "opc.purchase-order", "<not-a-purchase-order"));

    const result = await dispatchPending();

    expect(result).toEqual({ delivered: 0, failed: 1 });
    expect(db.select().from(outboxDeliveries).get()?.status).not.toBe("delivered");
  });
});
