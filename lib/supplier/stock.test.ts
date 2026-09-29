import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import {
  orderWorkflow,
  outboxDeliveries,
  outboxMessages,
  purchaseOrders,
  supplierAddresses,
  supplierContacts,
  supplierInventory,
  supplierLineItems,
  supplierOrders,
} from "../../db/schema";
import { getSupplierOrder, listSupplierOrderIdsByStatus } from "../b2b/exchange/supplierOrders";
import type { PurchaseOrder } from "../b2b/documents/purchaseOrder";
import { dispatchPending } from "../messaging/dispatcher";
import { registerConsumer } from "../messaging/outbox";
import { createOrderFulfillmentHandler } from "../orders/invoice";
import { createPurchaseOrder, getStoredOrder } from "../orders/store";
import { startTracking, updateStatus } from "../orders/workflow";
import * as fulfilment from "./fulfilment";
import { applyStockUpdate, fulfilSupplierOrder, refulfilPendingSupplierOrders } from "./stock";

vi.mock("./fulfilment", async (importOriginal) => {
  const original = await importOriginal<typeof import("./fulfilment")>();
  return { ...original, buildSupplierInvoice: vi.fn(original.buildSupplierInvoice) };
});

const NOW = new Date("2026-03-04T10:00:00Z");

beforeEach(() => {
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
  db.delete(supplierInventory).run();
  db.delete(supplierOrders).run();
  db.delete(orderWorkflow).run();
  db.delete(purchaseOrders).run();
});

afterEach(() => {
  vi.mocked(fulfilment.buildSupplierInvoice).mockClear();
});

type Spec = [itemId: string, quantity: number, shipped?: number];

function seedSupplierOrder(orderId: string, specs: Spec[], status = "PENDING"): void {
  db.insert(supplierOrders)
    .values({
      orderId,
      orderDate: new Date("2026-01-02T00:00:00Z"),
      status,
      createdAt: new Date(0),
    })
    .run();
  db.insert(supplierContacts)
    .values({ orderId, familyName: "Doe", givenName: "Jane", email: "j@example.com", phone: "555" })
    .run();
  db.insert(supplierAddresses)
    .values({
      orderId,
      streetName1: "1 Main",
      city: "X",
      state: "CA",
      zipCode: "94303",
      country: "US",
    })
    .run();
  specs.forEach(([itemId, quantity, shipped = 0], i) =>
    db
      .insert(supplierLineItems)
      .values({
        orderId,
        categoryId: "FISH",
        productId: "FI-1",
        itemId,
        lineNum: i + 1,
        quantity,
        unitPrice: 2050,
        quantityShipped: shipped,
      })
      .run(),
  );
}

function stockOf(itemId: string): number | undefined {
  return db.select().from(supplierInventory).where(eq(supplierInventory.itemId, itemId)).get()
    ?.quantity;
}

function setStock(itemId: string, quantity: number): void {
  db.insert(supplierInventory).values({ itemId, quantity }).run();
}

function invoiceMessages() {
  return db
    .select()
    .from(outboxMessages)
    .all()
    .filter((m) => m.channel === "opc.invoice");
}

describe("supplier order fulfilment", () => {
  it("[SWHR-C-0373] supplier orders in PENDING list 1001 and 1003 once each", () => {
    seedSupplierOrder("1001", [["EST-1", 1]]);
    seedSupplierOrder("1002", [["EST-1", 1]], "COMPLETED");
    seedSupplierOrder("1003", [["EST-1", 1]]);

    expect(listSupplierOrderIdsByStatus("PENDING").sort()).toEqual(["1001", "1003"]);
  });

  it("[SWHR-C-0375] shipping every outstanding line completes the supplier order", () => {
    seedSupplierOrder("1001", [
      ["EST-1", 2],
      ["EST-6", 1],
    ]);
    setStock("EST-1", 5);
    setStock("EST-6", 1);

    const invoice = db.transaction((tx) => fulfilSupplierOrder(tx, "1001", NOW));

    expect(invoice?.lineItems).toHaveLength(2);
    const order = getSupplierOrder("1001");
    expect(order?.status).toBe("COMPLETED");
    expect(order?.lineItems.map((l) => l.quantityShipped)).toEqual([2, 1]);
    expect(stockOf("EST-1")).toBe(3);
    expect(stockOf("EST-6")).toBe(0);
  });

  it("[SWHR-C-0384] a later attempt's invoice lists only EST-6 with the original order date and today's ship date", () => {
    seedSupplierOrder("1001", [
      ["EST-1", 2, 2],
      ["EST-6", 1],
    ]);
    setStock("EST-1", 7);
    setStock("EST-6", 4);

    const invoice = db.transaction((tx) => fulfilSupplierOrder(tx, "1001", NOW));

    expect(invoice?.lineItems.map((l) => l.itemId)).toEqual(["EST-6"]);
    expect(invoice?.orderDate).toEqual(new Date("2026-01-02T00:00:00Z"));
    expect(invoice?.shippingDate).toEqual(NOW);
    expect(invoice?.userId).toBe("Dear PetStore Customer");
    expect(stockOf("EST-1")).toBe(7);
    expect(getSupplierOrder("1001")?.status).toBe("COMPLETED");
  });

  it("nothing shippable leaves the order PENDING and returns no invoice", () => {
    seedSupplierOrder("1001", [["EST-1", 2]]);

    const invoice = db.transaction((tx) => fulfilSupplierOrder(tx, "1001", NOW));

    expect(invoice).toBeNull();
    expect(getSupplierOrder("1001")?.status).toBe("PENDING");
  });

  it("[SWHR-C-0386] an invoice build failure on one pending order does not block the other", () => {
    seedSupplierOrder("1001", [["EST-1", 1]]);
    seedSupplierOrder("1003", [["EST-6", 1]]);
    setStock("EST-1", 5);
    setStock("EST-6", 5);
    vi.mocked(fulfilment.buildSupplierInvoice).mockImplementationOnce(() => {
      throw new Error("cannot build invoice");
    });

    const invoices = db.transaction((tx) => refulfilPendingSupplierOrders(tx, NOW));

    expect(invoices.map((i) => i.orderId)).toEqual(["1003"]);
    expect(getSupplierOrder("1001")?.status).toBe("PENDING");
    expect(stockOf("EST-1")).toBe(5);
    expect(getSupplierOrder("1003")?.status).toBe("COMPLETED");
    expect(stockOf("EST-6")).toBe(4);
  });

  it("[SWHR-C-0387] an invoice for a released order is published and received by order processing", async () => {
    seedSupplierOrder("1001", [["EST-6", 1]]);
    seedOpcOrder("1001");
    registerConsumer("opc.invoice", "order-fulfillment", createOrderFulfillmentHandler());

    db.transaction((tx) => applyStockUpdate(tx, [{ itemId: "EST-6", quantity: 3 }], NOW));

    expect(stockOf("EST-6")).toBe(2);
    expect(invoiceMessages()).toHaveLength(1);
    await dispatchPending();
    const stored = getStoredOrder("1001");
    expect(stored?.lines.find((l) => l.itemId === "EST-6")?.quantityShipped).toBe(1);
  });
});

function seedOpcOrder(orderId: string): void {
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
    orderDate: new Date("2026-01-02T00:00:00Z"),
    shippingInfo: contact,
    billingInfo: contact,
    totalPrice: "40.00",
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
      {
        categoryId: "REPTILES",
        productId: "RP-SN-01",
        itemId: "EST-6",
        lineNum: 2,
        quantity: 1,
        unitPrice: "20.00",
      },
    ],
  };
  createPurchaseOrder(db, po);
  startTracking(db, orderId);
  updateStatus(db, orderId, "APPROVED");
}
