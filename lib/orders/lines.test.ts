import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { db } from "../../db/client";
import { orderLines, orderWorkflow, purchaseOrders } from "../../db/schema";
import type { Executor } from "../account/types";
import type { PurchaseOrder } from "../b2b/documents/purchaseOrder";
import * as lines from "./lines";
import { copyLine, setShippedQuantity } from "./lines";
import { createPurchaseOrder as storeOrder, getStoredOrder } from "./store";
import { startTracking } from "./workflow";

// A stored order is read back with its workflow status, so tracking starts with it.
const createPurchaseOrder = (tx: Executor, po: PurchaseOrder): void => {
  storeOrder(tx, po);
  startTracking(tx, po.orderId);
};

beforeEach(() => {
  db.delete(orderWorkflow).run();
  db.delete(purchaseOrders).run();
});

function order(): PurchaseOrder {
  const contact = {
    familyName: "X",
    givenName: "A",
    email: "a@example.com",
    phone: "555",
    address: {
      streetName1: "1 Main",
      streetName2: null,
      city: "C",
      state: "S",
      zipCode: "1",
      country: "US",
    },
  };
  return {
    locale: "en_US",
    orderId: "2001",
    userId: "u",
    emailId: "a@example.com",
    orderDate: new Date("2026-01-02T03:04:05Z"),
    shippingInfo: contact,
    billingInfo: contact,
    totalPrice: "49.50",
    creditCard: { cardNumber: "•••• •••• •••• 4242", cardType: "Visa", expiryDate: "12/2030" },
    lineItems: [
      {
        categoryId: "FISH",
        productId: "FI-SW-01",
        itemId: "EST-1",
        lineNum: 1,
        quantity: 3,
        unitPrice: "16.50",
      },
    ],
  };
}

describe("order lines", () => {
  test("[SWHR-C-0349] ordered quantity of a stored line cannot be changed", () => {
    createPurchaseOrder(db, order());
    // The module exposes no operation that touches any field but quantityShipped.
    expect(Object.keys(lines).sort()).toEqual(["copyLine", "setShippedQuantity"]);
    expect(setShippedQuantity.length).toBe(4);
    setShippedQuantity(db, "2001", 1, 2);
    const stored = db
      .select()
      .from(orderLines)
      .where(and(eq(orderLines.orderId, "2001"), eq(orderLines.lineNum, 1)))
      .get();
    expect(stored?.quantity).toBe(3);
    expect(stored?.quantityShipped).toBe(2);
    expect(getStoredOrder("2001")?.lines[0]?.quantity).toBe(3);
  });

  test("[SWHR-C-0350] copying a line with shipped quantity 0 keeps other fields", () => {
    const copy = copyLine(
      {
        lineNum: 2,
        categoryId: "FISH",
        productId: "FI-SW-01",
        itemId: "EST-2",
        quantity: 4,
        unitPrice: 1200,
        quantityShipped: 4,
      },
      0,
    );
    expect(copy).toEqual({
      lineNum: 2,
      categoryId: "FISH",
      productId: "FI-SW-01",
      itemId: "EST-2",
      quantity: 4,
      unitPrice: 1200,
      quantityShipped: 0,
    });
  });
});
