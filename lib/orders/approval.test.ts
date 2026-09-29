import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { outboxDeliveries, outboxMessages, purchaseOrders } from "../../db/schema";
import {
  type ApprovalEntry,
  readOrderApproval,
  writeOrderApproval,
} from "../b2b/documents/orderApproval";
import type { PurchaseOrder } from "../b2b/documents/purchaseOrder";
import { readSupplierOrder } from "../b2b/documents/supplierOrder";
import { dispatchPending } from "../messaging/dispatcher";
import { enqueue, registerConsumer } from "../messaging/outbox";
import { createOrderApprovalHandler } from "./approval";
import { persistPurchaseOrder } from "./store";

beforeEach(() => {
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
  db.delete(purchaseOrders).run();
  registerConsumer("opc.order-approval", "order-approval", createOrderApprovalHandler());
});

function order(orderId: string, totalPrice = "51.50"): PurchaseOrder {
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
    totalPrice,
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

const seed = (orderId: string, status?: string, total?: string) => {
  db.transaction((tx) => persistPurchaseOrder(tx, order(orderId, total)));
  if (status) {
    db.update(purchaseOrders).set({ status }).where(eq(purchaseOrders.orderId, orderId)).run();
  }
};
const statusOf = (orderId: string) =>
  db.select().from(purchaseOrders).where(eq(purchaseOrders.orderId, orderId)).get()?.status;
const decide = (entries: ApprovalEntry[]) =>
  db.transaction((tx) => enqueue(tx, "opc.order-approval", writeOrderApproval(entries)));
const payloads = (channel: string) =>
  db
    .select()
    .from(outboxMessages)
    .all()
    .filter((m) => m.channel === channel)
    .map((m) => m.payload);

describe("order approval consumer", () => {
  it("[SWHR-C-0306] approving an already-approved order changes only the pending one", async () => {
    seed("1001", "APPROVED");
    seed("1002");
    decide([
      { orderId: "1001", status: "APPROVED" },
      { orderId: "1002", status: "APPROVED" },
    ]);

    expect(await dispatchPending()).toEqual({ delivered: 1, failed: 0 });

    expect(statusOf("1001")).toBe("APPROVED");
    expect(statusOf("1002")).toBe("APPROVED");
    const pos = payloads("supplier.purchase-order");
    expect(pos).toHaveLength(1);
    expect((await readSupplierOrder(pos[0]!)).orderId).toBe("1002");
    const notices = payloads("opc.approval-notice");
    expect(notices).toHaveLength(1);
    expect(await readOrderApproval(notices[0]!)).toEqual([{ orderId: "1002", status: "APPROVED" }]);
  });

  it("[SWHR-C-0307] a batch approving 1001 and denying 1002 sends one supplier PO and one notice", async () => {
    seed("1001");
    seed("1002");
    const entries: ApprovalEntry[] = [
      { orderId: "1001", status: "APPROVED" },
      { orderId: "1002", status: "DENIED" },
    ];
    decide(entries);

    await dispatchPending();

    expect(statusOf("1001")).toBe("APPROVED");
    expect(statusOf("1002")).toBe("DENIED");
    const pos = payloads("supplier.purchase-order");
    expect(pos).toHaveLength(1);
    const so = await readSupplierOrder(pos[0]!);
    expect(so.orderId).toBe("1001");
    expect(so.lineItems[0]?.unitPrice).toBe("20.00");
    const notices = payloads("opc.approval-notice");
    expect(notices).toHaveLength(1);
    expect(await readOrderApproval(notices[0]!)).toEqual(entries);
  });

  it("[SWHR-C-0308] an auto-approved en_US order of 120 gets the same supplier PO and notice", async () => {
    seed("2001", undefined, "120.00");
    decide([{ orderId: "2001", status: "APPROVED" }]);

    await dispatchPending();

    expect(statusOf("2001")).toBe("APPROVED");
    const pos = payloads("supplier.purchase-order");
    expect(pos).toHaveLength(1);
    expect((await readSupplierOrder(pos[0]!)).orderId).toBe("2001");
    const notices = payloads("opc.approval-notice");
    expect(notices).toHaveLength(1);
    expect(await readOrderApproval(notices[0]!)).toEqual([{ orderId: "2001", status: "APPROVED" }]);
  });

  it("ignores an unknown order with no side effects", async () => {
    decide([{ orderId: "9999", status: "APPROVED" }]);

    await dispatchPending();

    expect(payloads("supplier.purchase-order")).toHaveLength(0);
    expect(payloads("opc.approval-notice")).toHaveLength(0);
  });

  it("redelivering a processed batch changes and sends nothing", async () => {
    seed("1001");
    const entries: ApprovalEntry[] = [{ orderId: "1001", status: "APPROVED" }];
    decide(entries);
    await dispatchPending();
    decide(entries);
    await dispatchPending();

    expect(payloads("supplier.purchase-order")).toHaveLength(1);
    expect(payloads("opc.approval-notice")).toHaveLength(1);
  });

  it("throws on a malformed payload so the dispatcher retries", async () => {
    const handler = createOrderApprovalHandler();

    await expect(handler("<not-an-approval/>")).rejects.toThrow();
  });
});
