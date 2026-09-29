import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { db } from "../../db/client";
import { counters, customers, purchaseOrders, users } from "../../db/schema";
import { createCustomer, replaceCustomerAccount, getCustomerAccount } from "../account/customer";
import type { PurchaseOrder } from "../b2b/documents/purchaseOrder";
import { getStoredOrder, persistPurchaseOrder } from "./store";

beforeEach(() => {
  db.delete(purchaseOrders).run();
  db.delete(counters).run();
  db.delete(customers).run();
  db.delete(users).where(eq(users.passwordHash, "x")).run();
});

function order(overrides: Partial<PurchaseOrder> = {}): PurchaseOrder {
  return {
    locale: "en_US",
    orderId: "10011",
    userId: "j2ee",
    emailId: "abc@example.com",
    orderDate: new Date("2026-01-02T03:04:05Z"),
    shippingInfo: {
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
    },
    billingInfo: {
      familyName: "XYZ",
      givenName: "ABC",
      email: "abc@example.com",
      phone: "555-555-5555",
      address: {
        streetName1: "2 Bill",
        streetName2: null,
        city: "Oakland",
        state: "California",
        zipCode: "94601",
        country: "United States",
      },
    },
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
    ...overrides,
  };
}

describe("counters", () => {
  test("[SWHR-C-0280] inserting a second counter named 1001 is rejected", () => {
    db.insert(counters).values({ name: "1001", value: 0 }).run();
    expect(() => db.insert(counters).values({ name: "1001", value: 5 }).run()).toThrow();
    expect(db.select().from(counters).where(eq(counters.name, "1001")).all()).toHaveLength(1);
  });
});

describe("persistPurchaseOrder", () => {
  test("[SWHR-C-0281] stored order value is the supplied total 51.50, not recomputed", () => {
    persistPurchaseOrder(db, order());
    const stored = getStoredOrder("10011");
    expect(stored?.totalValue).toBe(5150);
    // The lines sum to 40.00, so the total was not re-derived from them.
    expect(stored?.lines).toEqual([
      {
        lineNum: 1,
        categoryId: "FISH",
        productId: "FI-SW-01",
        itemId: "EST-1",
        quantity: 2,
        unitPrice: 2000,
      },
    ]);
    expect(stored?.status).toBe("PENDING");
    expect(stored?.card.cardNumber).toBe("•••• •••• •••• 4242");
  });

  test("[SWHR-C-0282] stored order address is unchanged after the customer edits their profile", () => {
    db.insert(users).values({ userId: "j2ee", passwordHash: "x" }).run();
    createCustomer("j2ee");
    const account = getCustomerAccount("j2ee")!;
    replaceCustomerAccount("j2ee", {
      ...account,
      contactInfo: { ...account.contactInfo, address: order().shippingInfo.address as never },
    });
    persistPurchaseOrder(db, order());

    const current = getCustomerAccount("j2ee")!;
    replaceCustomerAccount("j2ee", {
      ...current,
      contactInfo: {
        ...current.contactInfo,
        address: { ...current.contactInfo.address, city: "San Jose" },
      },
    });

    expect(getCustomerAccount("j2ee")?.contactInfo.address.city).toBe("San Jose");
    expect(getStoredOrder("10011")?.address.city).toBe("Palo Alto");
  });

  test("persisting the same order id twice is a no-op", () => {
    persistPurchaseOrder(db, order());
    persistPurchaseOrder(db, order({ totalPrice: "99.00" }));
    expect(db.select().from(purchaseOrders).all()).toHaveLength(1);
    expect(getStoredOrder("10011")?.totalValue).toBe(5150);
  });
});
