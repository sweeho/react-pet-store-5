import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { orderWorkflow, outboxDeliveries, outboxMessages, purchaseOrders } from "../../db/schema";
import type { PurchaseOrder } from "../b2b/documents/purchaseOrder";
import { buildPartnerInvoice } from "../b2b/partner/tpaInvoice";
import { dispatchPending } from "../messaging/dispatcher";
import { enqueue, registerConsumer } from "../messaging/outbox";
import { applyInvoice, createOrderFulfillmentHandler } from "./invoice";
import { createPurchaseOrder, getStoredOrder } from "./store";
import { getStatus, startTracking, updateStatus } from "./workflow";

beforeEach(() => {
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
  db.delete(orderWorkflow).run();
  db.delete(purchaseOrders).run();
});

// Order 1001: 2 x EST-1 (line 1) and 1 x EST-6 (line 2), seeded APPROVED.
function seed(orderId = "1001", quantities: [number, number] = [2, 1]): void {
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
  const po: PurchaseOrder = {
    locale: "en_US",
    orderId,
    userId: "j2ee",
    emailId: "abc@example.com",
    orderDate: new Date("2026-01-02T03:04:05Z"),
    shippingInfo: contact,
    billingInfo: contact,
    totalPrice: "60.00",
    creditCard: { cardNumber: "•••• •••• •••• 4242", cardType: "Visa", expiryDate: "12/2030" },
    lineItems: [
      {
        categoryId: "FISH",
        productId: "FI-SW-01",
        itemId: "EST-1",
        lineNum: 1,
        quantity: quantities[0],
        unitPrice: "20.00",
      },
      {
        categoryId: "REPTILES",
        productId: "RP-SN-01",
        itemId: "EST-6",
        lineNum: 2,
        quantity: quantities[1],
        unitPrice: "20.00",
      },
    ],
  };
  db.transaction((tx) => {
    createPurchaseOrder(tx, po);
    startTracking(tx, orderId);
  });
  updateStatus(db, orderId, "APPROVED");
}

const apply = (shipped: Record<string, number>, orderId = "1001") =>
  db.transaction((tx) => applyInvoice(tx, orderId, shipped));
const shippedOf = (orderId = "1001") =>
  getStoredOrder(orderId)?.lines.map((l) => l.quantityShipped);
const completedNotices = () =>
  db
    .select()
    .from(outboxMessages)
    .all()
    .filter((m) => m.channel === "opc.completed-order");

describe("invoice application", () => {
  it("[SWHR-C-0366] an invoice for 2 x EST-1 updates only the EST-1 line", () => {
    seed();
    apply({ "EST-1": 2 });
    expect(shippedOf()).toEqual([2, 0]);
  });

  it("[SWHR-C-0367] an invoice for EST-99, not on the order, changes no line", () => {
    seed();
    apply({ "EST-99": 1 });
    expect(shippedOf()).toEqual([0, 0]);
  });

  it("[SWHR-C-0368] the final invoice completes 1001 and raises one completed notice", () => {
    seed();
    expect(apply({ "EST-1": 2, "EST-6": 1 })).toBe("COMPLETED");
    expect(getStatus(db, "1001")).toBe("COMPLETED");
    const notices = completedNotices();
    expect(notices).toHaveLength(1);
    expect(notices[0]?.payload).toBe("1001");
  });

  it("[SWHR-C-0369] an invoice covering one of two lines gives SHIPPED_PART without a notice", () => {
    seed();
    expect(apply({ "EST-1": 2 })).toBe("SHIPPED_PART");
    expect(getStatus(db, "1001")).toBe("SHIPPED_PART");
    expect(completedNotices()).toHaveLength(0);
  });

  it("[SWHR-C-0370] over-shipment of 3 against 2 gives SHIPPED_PART without a notice", () => {
    seed("1001", [2, 0]);
    apply({ "EST-1": 3 });
    expect(shippedOf()?.[0]).toBe(3);
    expect(getStatus(db, "1001")).toBe("SHIPPED_PART");
    expect(completedNotices()).toHaveLength(0);
  });

  it("[SWHR-C-0354] the first line's shipment gives SHIPPED_PART and the second gives COMPLETED", () => {
    seed();
    apply({ "EST-1": 2 });
    expect(getStatus(db, "1001")).toBe("SHIPPED_PART");
    apply({ "EST-6": 1 });
    expect(getStatus(db, "1001")).toBe("COMPLETED");
    expect(completedNotices()).toHaveLength(1);
  });
});

describe("order-fulfillment consumer", () => {
  it("applies a delivered partner invoice and an unknown order retries", async () => {
    registerConsumer("opc.invoice", "order-fulfillment", createOrderFulfillmentHandler());
    seed();
    const invoice = (orderId: string) =>
      buildPartnerInvoice({
        orderId,
        userId: "Dear PetStore Customer",
        orderDate: new Date("2026-01-02T00:00:00Z"),
        shippingDate: new Date("2026-01-03T00:00:00Z"),
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
      });
    db.transaction((tx) => enqueue(tx, "opc.invoice", invoice("1001")));
    expect(await dispatchPending()).toEqual({ delivered: 1, failed: 0 });
    expect(shippedOf()).toEqual([2, 0]);

    db.transaction((tx) => enqueue(tx, "opc.invoice", invoice("9999")));
    expect(await dispatchPending()).toEqual({ delivered: 0, failed: 1 });
  });
});
