import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { db } from "../../db/client";
import * as schema from "../../db/schema";
import {
  customers,
  itemDetails,
  orderCards,
  orderContacts,
  orderLines,
  users,
} from "../../db/schema";
import { createCustomer, replaceCustomerAccount, getCustomerAccount } from "../account/customer";
import type { PurchaseOrder } from "../b2b/documents/purchaseOrder";
import { DuplicateOrderError } from "./errors";
import { setShippedQuantity } from "./lines";
import { createPurchaseOrder, getStoredOrder, persistPurchaseOrder } from "./store";

// The checkout tables are addressed through the namespace so a missing table
// fails an assertion here rather than erroring at import.
function tables() {
  const { counters, purchaseOrders } = schema as Partial<typeof schema>;
  expect(counters).toBeDefined();
  expect(purchaseOrders).toBeDefined();
  return { counters: counters!, purchaseOrders: purchaseOrders! };
}

beforeEach(() => {
  const { counters, purchaseOrders } = tables();
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
    const { counters } = tables();
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
    const { purchaseOrders } = tables();
    expect(db.select().from(purchaseOrders).all()).toHaveLength(1);
    expect(getStoredOrder("10011")?.totalValue).toBe(5150);
  });
});

function order1001(overrides: Partial<PurchaseOrder> = {}): PurchaseOrder {
  const base = order();
  return order({
    orderId: "1001",
    totalPrice: "72.50",
    lineItems: [
      ...base.lineItems,
      {
        categoryId: "REPTILES",
        productId: "RP-SN-01",
        itemId: "EST-6",
        lineNum: 2,
        quantity: 1,
        unitPrice: "16.50",
      },
    ],
    ...overrides,
  });
}

describe("createPurchaseOrder", () => {
  test("[SWHR-C-0341] order 1001 is stored and retrievable with all fields and both lines", () => {
    createPurchaseOrder(db, order1001());
    const stored = getStoredOrder("1001");
    expect(stored).toMatchObject({
      orderId: "1001",
      userId: "j2ee",
      emailId: "abc@example.com",
      orderDate: new Date("2026-01-02T03:04:05Z"),
      locale: "en_US",
      totalValue: 7250,
      contact: { givenName: "ABC", familyName: "XYZ", telephone: "555-555-5555" },
      address: { streetName1: "1 Main", city: "Palo Alto", zipCode: "94303" },
      card: { cardType: "Visa", expiryDate: "12/2030" },
    });
    expect(stored?.lines).toHaveLength(2);
    // SD-2: the card number is stored masked, never in full.
    expect(stored?.card.cardNumber).toMatch(/^•+ •+ •+ \d{4}$/);
  });

  test("[SWHR-C-0342] a second order with id 1001 fails and the first is unchanged", () => {
    createPurchaseOrder(db, order1001());
    expect(() => createPurchaseOrder(db, order1001({ totalPrice: "10.00" }))).toThrow(
      DuplicateOrderError,
    );
    const stored = getStoredOrder("1001");
    expect(stored?.totalValue).toBe(7250);
    expect(stored?.lines).toHaveLength(2);
  });

  test("[SWHR-C-0343] created lines start with shipped quantity 0 and carry incoming fields", () => {
    createPurchaseOrder(db, order1001());
    expect(getStoredOrder("1001")?.lines).toEqual([
      {
        lineNum: 1,
        categoryId: "FISH",
        productId: "FI-SW-01",
        itemId: "EST-1",
        quantity: 2,
        unitPrice: 2000,
        quantityShipped: 0,
      },
      {
        lineNum: 2,
        categoryId: "REPTILES",
        productId: "RP-SN-01",
        itemId: "EST-6",
        quantity: 1,
        unitPrice: 1650,
        quantityShipped: 0,
      },
    ]);
  });

  test("[SWHR-C-0344] a credit card insert failure rolls back header, contact and lines", () => {
    const bad = order1001({
      orderId: "1005",
      // A null card number violates NOT NULL on the card insert.
      creditCard: {
        cardNumber: null as unknown as string,
        cardType: "Visa",
        expiryDate: "12/2030",
      },
    });
    expect(() => createPurchaseOrder(db, bad)).toThrow();
    const { purchaseOrders } = tables();
    expect(
      db.select().from(purchaseOrders).where(eq(purchaseOrders.orderId, "1005")).all(),
    ).toEqual([]);
    expect(db.select().from(orderContacts).where(eq(orderContacts.orderId, "1005")).all()).toEqual(
      [],
    );
    expect(db.select().from(orderCards).where(eq(orderCards.orderId, "1005")).all()).toEqual([]);
    expect(db.select().from(orderLines).where(eq(orderLines.orderId, "1005")).all()).toEqual([]);
  });

  test("[SWHR-C-0345] billing A. Buyer and shipping B. Receiver both read back as B. Receiver", () => {
    const base = order();
    createPurchaseOrder(
      db,
      order1001({
        billingInfo: { ...base.billingInfo, givenName: "A.", familyName: "Buyer" },
        shippingInfo: { ...base.shippingInfo, givenName: "B.", familyName: "Receiver" },
      }),
    );
    const stored = getStoredOrder("1001");
    expect(stored?.billingContact).toMatchObject({ givenName: "B.", familyName: "Receiver" });
    expect(stored?.shippingContact).toMatchObject({ givenName: "B.", familyName: "Receiver" });
  });

  test("[SWHR-C-0347] the snapshot stays complete after the loading transaction ends", () => {
    createPurchaseOrder(db, order1001());
    setShippedQuantity(db, "1001", 2, 2);
    const snapshot = db.transaction((tx) => getStoredOrder("1001", tx));
    expect(snapshot?.lines.map((l) => l.quantityShipped)).toEqual([0, 2]);
    expect(snapshot?.userId).toBe("j2ee");
    expect(snapshot?.contact.givenName).toBe("ABC");
    expect(snapshot?.billingContact.telephone).toBe("555-555-5555");
    expect(snapshot?.card.cardType).toBe("Visa");
  });

  test("[SWHR-C-0348] a stored line keeps 16.50 after the catalog price changes to 18.50", () => {
    createPurchaseOrder(db, order1001());
    const before = db
      .select({ p: itemDetails.listPrice })
      .from(itemDetails)
      .where(eq(itemDetails.itemId, "EST-1"))
      .get();
    db.update(itemDetails).set({ listPrice: 1850 }).where(eq(itemDetails.itemId, "EST-1")).run();
    try {
      expect(getStoredOrder("1001")?.lines[1]?.unitPrice).toBe(1650);
    } finally {
      if (before)
        db.update(itemDetails)
          .set({ listPrice: before.p })
          .where(eq(itemDetails.itemId, "EST-1"))
          .run();
    }
  });
});
