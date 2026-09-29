import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { orderWorkflow, purchaseOrders } from "../../db/schema";
import { applyApprovalBatch } from "./approval";
import { OrderNotFoundError, WorkflowCreateError } from "./errors";
import {
  getStatus,
  listOrderIdsByStatus,
  startTracking,
  transition,
  updateStatus,
} from "./workflow";
import { persistPurchaseOrder } from "./store";
import type { PurchaseOrder } from "../b2b/documents/purchaseOrder";

beforeEach(() => {
  db.delete(orderWorkflow).run();
  db.delete(purchaseOrders).run();
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
    ],
  };
}

const rowsFor = (id: string) =>
  db.select().from(orderWorkflow).where(eq(orderWorkflow.orderId, id)).all();

describe("order workflow tracking", () => {
  it("[SWHR-C-0351] a status read of 1001 returns exactly APPROVED", () => {
    startTracking(db, "1001");
    updateStatus(db, "1001", "APPROVED");

    expect(getStatus(db, "1001")).toBe("APPROVED");
    expect(rowsFor("1001")).toHaveLength(1);
  });

  it("[SWHR-C-0352] approving a PENDING order sets APPROVED", () => {
    db.transaction((tx) => persistPurchaseOrder(tx, order("1001")));

    db.transaction((tx) => applyApprovalBatch(tx, [{ orderId: "1001", status: "APPROVED" }]));

    expect(getStatus(db, "1001")).toBe("APPROVED");
  });

  it("[SWHR-C-0353] denying a PENDING order sets DENIED", () => {
    db.transaction((tx) => persistPurchaseOrder(tx, order("1001")));

    db.transaction((tx) => applyApprovalBatch(tx, [{ orderId: "1001", status: "DENIED" }]));

    expect(getStatus(db, "1001")).toBe("DENIED");
  });

  it("[SWHR-C-0355] starting tracking for 1001 creates a PENDING record", () => {
    startTracking(db, "1001");

    expect(getStatus(db, "1001")).toBe("PENDING");
    expect(rowsFor("1001")).toHaveLength(1);
  });

  it("[SWHR-C-0356] starting tracking twice fails and keeps APPROVED", () => {
    startTracking(db, "1001");
    updateStatus(db, "1001", "APPROVED");

    expect(() => startTracking(db, "1001")).toThrow(WorkflowCreateError);
    expect(getStatus(db, "1001")).toBe("APPROVED");
  });

  it("[SWHR-C-0357] updating 1001 from PENDING to APPROVED is readable", () => {
    startTracking(db, "1001");

    updateStatus(db, "1001", "APPROVED");

    expect(getStatus(db, "1001")).toBe("APPROVED");
  });

  it("[SWHR-C-0358] a status update for unknown 9999 fails and creates nothing", () => {
    expect(() => updateStatus(db, "9999", "APPROVED")).toThrow(OrderNotFoundError);
    expect(rowsFor("9999")).toHaveLength(0);
  });

  it("[SWHR-C-0359] a status read for unknown 9999 fails with not-found", () => {
    expect(() => getStatus(db, "9999")).toThrow(OrderNotFoundError);
  });

  it("[SWHR-C-0360] listing PENDING returns exactly 1001 and 1003", () => {
    for (const id of ["1001", "1002", "1003"]) startTracking(db, id);
    updateStatus(db, "1002", "APPROVED");

    expect(listOrderIdsByStatus(db, "PENDING").sort()).toEqual(["1001", "1003"]);
  });

  it("[SWHR-C-0361] an approval step failing after the status update leaves 1001 PENDING", () => {
    startTracking(db, "1001");

    expect(() =>
      db.transaction((tx) => {
        expect(transition(tx, "1001", "APPROVED")).toBe(true);
        throw new Error("step failed");
      }),
    ).toThrow("step failed");

    expect(getStatus(db, "1001")).toBe("PENDING");
  });

  it("transition only moves along the lifecycle", () => {
    startTracking(db, "1001");
    expect(transition(db, "1001", "COMPLETED")).toBe(false);
    expect(transition(db, "1001", "DENIED")).toBe(true);
    expect(transition(db, "1001", "APPROVED")).toBe(false);
    expect(getStatus(db, "1001")).toBe("DENIED");
    expect(transition(db, "9999", "APPROVED")).toBe(false);
  });
});
