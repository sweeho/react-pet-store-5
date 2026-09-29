import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../db/client";
import { orderWorkflow, outboxDeliveries, outboxMessages, purchaseOrders } from "../../db/schema";
import {
  type ApprovalEntry,
  readOrderApproval,
  writeOrderApproval,
} from "../b2b/documents/orderApproval";
import type { PurchaseOrder } from "../b2b/documents/purchaseOrder";
import * as supplierChannel from "../b2b/exchange/supplierChannel";
import { dispatchPending } from "../messaging/dispatcher";
import { enqueue, registerConsumer } from "../messaging/outbox";
import { createOrderApprovalHandler } from "./approval";
import { persistPurchaseOrder } from "./store";
import { getStatus, updateStatus, type OrderStatus } from "./workflow";

beforeEach(() => {
  vi.restoreAllMocks();
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
  db.delete(orderWorkflow).run();
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

const seed = (orderId: string, status?: OrderStatus, total?: string) => {
  db.transaction((tx) => persistPurchaseOrder(tx, order(orderId, total)));
  if (status) {
    updateStatus(db, orderId, status);
  }
};
const statusOf = (orderId: string) => getStatus(db, orderId);
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
    expect(pos[0]).toContain("1002");
    expect(pos[0]).not.toContain("1001");
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
    expect(pos[0]).toContain("1001");
    expect(pos[0]).not.toContain("1002");
    expect(pos[0]).toContain("20.00");
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
    expect(pos[0]).toContain("2001");
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

  it("[SWHR-C-0363] approving 1001 sends exactly one supplier PO with ship-to and both lines", async () => {
    const base = order("1001");
    db.transaction((tx) =>
      persistPurchaseOrder(tx, {
        ...base,
        lineItems: [
          ...base.lineItems,
          { ...base.lineItems[0]!, itemId: "EST-6", lineNum: 2, quantity: 1 },
        ],
      }),
    );
    decide([{ orderId: "1001", status: "APPROVED" }]);
    await dispatchPending();

    expect(statusOf("1001")).toBe("APPROVED");
    const pos = payloads("supplier.purchase-order");
    expect(pos).toHaveLength(1);
    expect(pos[0]).toContain("1 Main");
    expect(pos[0]).toContain("EST-1");
    expect(pos[0]).toContain("EST-6");
  });

  it("[SWHR-C-0364] denying 1002 sends no supplier PO", async () => {
    seed("1002");
    decide([{ orderId: "1002", status: "DENIED" }]);
    await dispatchPending();

    expect(statusOf("1002")).toBe("DENIED");
    expect(payloads("supplier.purchase-order")).toHaveLength(0);
  });

  it("[SWHR-C-0365] a mixed batch sends the 1001 supplier PO then one notice for both", async () => {
    seed("1001");
    seed("1002");
    const entries: ApprovalEntry[] = [
      { orderId: "1001", status: "APPROVED" },
      { orderId: "1002", status: "DENIED" },
    ];
    decide(entries);
    await dispatchPending();

    const order = db
      .select()
      .from(outboxMessages)
      .all()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((m) => m.channel)
      .filter((c) => c !== "opc.order-approval");
    expect(order).toEqual(["supplier.purchase-order", "opc.approval-notice"]);
    const notices = payloads("opc.approval-notice");
    expect(notices).toHaveLength(1);
    expect(await readOrderApproval(notices[0]!)).toEqual(entries);
  });

  it("[SWHR-C-0371] a supplier PO send failure leaves 1001 PENDING and the batch is redelivered", async () => {
    seed("1001");
    const real = supplierChannel.sendSupplierPurchaseOrders;
    vi.spyOn(supplierChannel, "sendSupplierPurchaseOrders").mockImplementationOnce(() => {
      throw new Error("send failed");
    });
    decide([{ orderId: "1001", status: "APPROVED" }]);

    expect(await dispatchPending({ now: new Date() })).toEqual({ delivered: 0, failed: 1 });
    expect(statusOf("1001")).toBe("PENDING");
    expect(payloads("supplier.purchase-order")).toHaveLength(0);
    expect(payloads("opc.approval-notice")).toHaveLength(0);
    // The failure is reported as a workflow step failure, with the original as cause.
    const delivery = db.select().from(outboxDeliveries).get();
    expect(delivery?.lastError).toContain('workflow step "order-approval" failed');

    vi.spyOn(supplierChannel, "sendSupplierPurchaseOrders").mockImplementation(real);
    const later = new Date(Date.now() + 60_000);
    expect(await dispatchPending({ now: later })).toEqual({ delivered: 1, failed: 0 });
    expect(statusOf("1001")).toBe("APPROVED");
    expect(payloads("supplier.purchase-order")).toHaveLength(1);
  });
});
