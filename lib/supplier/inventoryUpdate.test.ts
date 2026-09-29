import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import {
  outboxDeliveries,
  outboxMessages,
  supplierAddresses,
  supplierContacts,
  supplierInventory,
  supplierLineItems,
  supplierOrders,
} from "../../db/schema";
import { getSupplierOrder } from "../b2b/exchange/supplierOrders";
import * as fulfilment from "./fulfilment";
import { updateInventory } from "./inventoryUpdate";

vi.mock("./fulfilment", async (importOriginal) => {
  const original = await importOriginal<typeof import("./fulfilment")>();
  return { ...original, fulfil: vi.fn(original.fulfil) };
});

const NOW = new Date("2026-03-04T10:00:00Z");

beforeEach(() => {
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
  db.delete(supplierInventory).run();
  db.delete(supplierOrders).run();
});

function seedSupplierOrder(orderId: string, itemId: string, quantity: number): void {
  db.insert(supplierOrders)
    .values({
      orderId,
      orderDate: new Date("2026-01-02T00:00:00Z"),
      status: "PENDING",
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
  db.insert(supplierLineItems)
    .values({
      orderId,
      categoryId: "FISH",
      productId: "FI-1",
      itemId,
      lineNum: 1,
      quantity,
      unitPrice: 2050,
      quantityShipped: 0,
    })
    .run();
}

function setStock(itemId: string, quantity: number): void {
  db.insert(supplierInventory).values({ itemId, quantity }).run();
}

function stockOf(itemId: string): number | undefined {
  return db.select().from(supplierInventory).where(eq(supplierInventory.itemId, itemId)).get()
    ?.quantity;
}

function invoiceCount(): number {
  return db
    .select()
    .from(outboxMessages)
    .all()
    .filter((m) => m.channel === "opc.invoice").length;
}

describe("updateInventory", () => {
  it("[SWHR-C-0398] restocking EST-9 to 20 ships the 5-unit back-order and leaves 15", () => {
    setStock("EST-9", 0);
    seedSupplierOrder("1001", "EST-9", 5);

    const result = updateInventory([{ itemId: "EST-9", update: true, quantity: "20" }], NOW);

    expect(result).toEqual({ ok: true, updated: ["EST-9"], invoicedOrderIds: ["1001"] });
    expect(stockOf("EST-9")).toBe(15);
    const order = getSupplierOrder("1001");
    expect(order?.status).toBe("COMPLETED");
    expect(order?.lineItems[0]?.quantityShipped).toBe(5);
    expect(invoiceCount()).toBe(1);
  });

  it("[SWHR-C-0399] restocking EST-10 to 20 does not fill a 50-unit order", () => {
    setStock("EST-10", 0);
    seedSupplierOrder("1002", "EST-10", 50);

    const result = updateInventory([{ itemId: "EST-10", update: true, quantity: "20" }], NOW);

    expect(result).toEqual({ ok: true, updated: ["EST-10"], invoicedOrderIds: [] });
    expect(stockOf("EST-10")).toBe(20);
    expect(getSupplierOrder("1002")?.status).toBe("PENDING");
    expect(invoiceCount()).toBe(0);
  });

  it("[SWHR-C-0400] a re-fulfilment failure rolls back the stock change and the order change", () => {
    setStock("EST-9", 0);
    seedSupplierOrder("1001", "EST-9", 5);
    vi.mocked(fulfilment.fulfil).mockImplementationOnce(() => {
      throw new Error("disk failure");
    });

    expect(() => updateInventory([{ itemId: "EST-9", update: true, quantity: "20" }], NOW)).toThrow(
      "disk failure",
    );

    expect(stockOf("EST-9")).toBe(0);
    expect(getSupplierOrder("1001")?.status).toBe("PENDING");
    expect(getSupplierOrder("1001")?.lineItems[0]?.quantityShipped).toBe(0);
    expect(invoiceCount()).toBe(0);
  });

  it("a rejected plan writes nothing", () => {
    setStock("EST-9", 0);

    const result = updateInventory(
      [
        { itemId: "EST-9", update: true, quantity: "20" },
        { itemId: "NOPE", update: true, quantity: "1" },
      ],
      NOW,
    );

    expect(result).toEqual({ ok: false, invalid: [], unknown: ["NOPE"] });
    expect(stockOf("EST-9")).toBe(0);
    expect(stockOf("NOPE")).toBeUndefined();
  });
});
