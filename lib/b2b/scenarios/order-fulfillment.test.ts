import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import {
  orderWorkflow,
  outboxDeliveries,
  outboxMessages,
  purchaseOrders,
  supplierInventory,
  supplierOrders,
} from "../../../db/schema";
import { dispatchPending } from "../../messaging/dispatcher";
import { enqueue, registerConsumer } from "../../messaging/outbox";
import { createOrderApprovalHandler } from "../../orders/approval";
import { createOrderIntakeHandler } from "../../orders/intake";
import { createOrderFulfillmentHandler } from "../../orders/invoice";
import { getStoredOrder } from "../../orders/store";
import { getStatus } from "../../orders/workflow";
import { fulfilSupplierOrder, applyStockUpdate } from "../../supplier/stock";
import { type PurchaseOrder, writePurchaseOrder } from "../documents/purchaseOrder";
import { createSupplierIntakeHandler } from "../exchange/supplierIntake";
import { getSupplierOrder } from "../exchange/supplierOrders";

function purchaseOrder(orderId: string, lines: [string, number][]): PurchaseOrder {
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
    totalPrice: "40.00",
    creditCard: { cardNumber: "•••• •••• •••• 4242", cardType: "Visa", expiryDate: "12/2030" },
    lineItems: lines.map(([itemId, quantity], i) => ({
      categoryId: "FISH",
      productId: "FI-SW-01",
      itemId,
      lineNum: i + 1,
      quantity,
      unitPrice: "20.00",
    })),
  };
}

const place = (po: PurchaseOrder) =>
  db.transaction((tx) => enqueue(tx, "opc.purchase-order", writePurchaseOrder(po)));

// Dispatcher rounds until nothing is left to deliver.
async function settle(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    const round = await dispatchPending();
    if (round.delivered + round.failed === 0) return;
  }
  throw new Error("outbox did not settle");
}

const invoicesFor = (orderId: string) =>
  db
    .select()
    .from(outboxMessages)
    .where(eq(outboxMessages.channel, "opc.invoice"))
    .all()
    .filter((m) => m.payload.includes(`>${orderId}<`));

beforeEach(() => {
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
  db.delete(orderWorkflow).run();
  db.delete(purchaseOrders).run();
  db.delete(supplierOrders).run();
  db.delete(supplierInventory).run();
  registerConsumer("opc.purchase-order", "order-intake", createOrderIntakeHandler());
  registerConsumer("opc.order-approval", "order-approval", createOrderApprovalHandler());
  registerConsumer("opc.invoice", "order-fulfillment", createOrderFulfillmentHandler());
  registerConsumer(
    "supplier.purchase-order",
    "supplier-intake",
    createSupplierIntakeHandler({
      shipOnReceipt: (tx, order) => {
        const invoice = fulfilSupplierOrder(tx, order.orderId, new Date());
        return invoice ? [invoice] : [];
      },
    }),
  );
});

describe("order fulfilment flow", () => {
  it("[SWHR-C-0340] an approved order returns at once, reaches the supplier and is invoiced back to COMPLETED", async () => {
    db.insert(supplierInventory).values({ itemId: "EST-1", quantity: 10 }).run();
    place(purchaseOrder("F-1", [["EST-1", 2]]));

    // Placing only enqueues: nothing has reached the supplier yet.
    expect(getSupplierOrder("F-1")).toBeNull();

    await settle();

    expect(getSupplierOrder("F-1")?.status).toBe("COMPLETED");
    expect(invoicesFor("F-1")).toHaveLength(1);
    expect(getStatus(db, "F-1")).toBe("COMPLETED");
    expect(getStoredOrder("F-1")?.lines.map((l) => l.quantityShipped)).toEqual([2]);
    expect(db.select().from(supplierInventory).get()?.quantity).toBe(8);
  });

  it("[SWHR-C-0385] a stock update releases the waiting order and completes the customer order", async () => {
    place(purchaseOrder("F-2", [["EST-6", 1]]));
    await settle();

    // No stock: the supplier order waits and the customer order stays APPROVED.
    expect(getSupplierOrder("F-2")?.status).toBe("PENDING");
    expect(getStatus(db, "F-2")).toBe("APPROVED");
    expect(invoicesFor("F-2")).toHaveLength(0);

    db.transaction((tx) => applyStockUpdate(tx, [{ itemId: "EST-6", quantity: 5 }], new Date()));
    await settle();

    expect(getSupplierOrder("F-2")?.status).toBe("COMPLETED");
    expect(invoicesFor("F-2")).toHaveLength(1);
    expect(getStatus(db, "F-2")).toBe("COMPLETED");
    expect(db.select().from(supplierInventory).get()?.quantity).toBe(4);
  });
});
