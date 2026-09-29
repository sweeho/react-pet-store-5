import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../db/client";
import { outboxDeliveries, outboxMessages, purchaseOrders } from "../../db/schema";
import { type PurchaseOrder, writePurchaseOrder } from "../b2b/documents/purchaseOrder";
import { dispatchPending } from "../messaging/dispatcher";
import * as outbox from "../messaging/outbox";
import { shouldAutoApprove } from "./approvalPolicy";
import { createOrderApprovalHandler } from "./approval";
import { createOrderIntakeHandler } from "./intake";
import { getStoredOrder } from "./store";

const { enqueue, registerConsumer } = outbox;

beforeEach(() => {
  vi.restoreAllMocks();
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
  db.delete(purchaseOrders).run();
  registerConsumer("opc.purchase-order", "order-intake", createOrderIntakeHandler());
  registerConsumer("opc.order-approval", "order-approval", createOrderApprovalHandler());
});

function order(orderId: string, locale = "en_US", totalPrice = "51.50"): PurchaseOrder {
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
    locale,
    orderId,
    userId: "j2ee",
    emailId: "abc@example.com",
    orderDate: new Date("2026-01-02T03:04:05Z"),
    shippingInfo: contact,
    billingInfo: contact,
    totalPrice,
    creditCard: { cardNumber: "•••• •••• •••• 4242", cardType: "Visa", expiryDate: "12/2030" },
    lineItems: [
      {
        categoryId: "FISH",
        productId: "FI-SW-01",
        itemId: "EST-1",
        lineNum: 1,
        quantity: 2,
        unitPrice: locale === "ja_JP" ? "20" : "20.00",
      },
    ],
  };
}

const send = (orderId: string, locale?: string, totalPrice?: string) =>
  db.transaction((tx) =>
    enqueue(tx, "opc.purchase-order", writePurchaseOrder(order(orderId, locale, totalPrice))),
  );

const statusOf = (orderId: string) =>
  db.select().from(purchaseOrders).where(eq(purchaseOrders.orderId, orderId)).get()?.status;
const approvalMessages = () =>
  db.select().from(outboxMessages).where(eq(outboxMessages.channel, "opc.order-approval")).all();

// Delivers the purchase order, then the approval it may have enqueued.
async function intake(): Promise<void> {
  await dispatchPending();
  await dispatchPending();
}

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

  describe("automatic approval", () => {
    it("[SWHR-C-0287] approves an en_US order of 499.99 and it is not pending", async () => {
      send("A1", "en_US", "499.99");
      await intake();
      expect(statusOf("A1")).toBe("APPROVED");
      expect(
        db.select().from(purchaseOrders).where(eq(purchaseOrders.status, "PENDING")).all(),
      ).toEqual([]);
    });

    it("[SWHR-C-0288] leaves an en_US order of exactly 500.00 PENDING", async () => {
      expect(shouldAutoApprove("en_US", 50000)).toBe(false);
      send("A2", "en_US", "500.00");
      await intake();
      expect(statusOf("A2")).toBe("PENDING");
      expect(approvalMessages()).toHaveLength(0);
    });

    it("[SWHR-C-0289] approves a ja_JP order of 49999", async () => {
      send("A3", "ja_JP", "49999");
      await intake();
      expect(statusOf("A3")).toBe("APPROVED");
    });

    it("[SWHR-C-0290] leaves a ja_JP order of 50000 PENDING", async () => {
      expect(shouldAutoApprove("ja_JP", 50000)).toBe(false);
      send("A4", "ja_JP", "50000");
      await intake();
      expect(statusOf("A4")).toBe("PENDING");
    });

    it("[SWHR-C-0291] leaves a zh_CN order of 1.00 PENDING and listed", async () => {
      expect(shouldAutoApprove("zh_CN", 100)).toBe(false);
      send("A5", "zh_CN", "1.00");
      await intake();
      const pending = db
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.status, "PENDING"))
        .all();
      expect(pending.map((o) => o.orderId)).toEqual(["A5"]);
    });

    it("a redelivered purchase order enqueues no second approval", async () => {
      send("A6", "en_US", "10.00");
      await intake();
      db.update(outboxDeliveries)
        .set({ status: "pending" })
        .where(eq(outboxDeliveries.consumer, "order-intake"))
        .run();
      await intake();
      expect(approvalMessages()).toHaveLength(1);
    });
  });
});
