import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import {
  supplierAddresses,
  supplierContacts,
  supplierLineItems,
  supplierOrders,
} from "../../../db/schema";
import { getSupplierOrder, listSupplierOrders } from "./supplierOrders";

beforeEach(() => {
  db.delete(supplierLineItems).run();
  db.delete(supplierContacts).run();
  db.delete(supplierAddresses).run();
  db.delete(supplierOrders).run();
});

function seedOrder(orderId: string): void {
  db.insert(supplierOrders)
    .values({ orderId, orderDate: new Date(2002, 2, 15), status: "PENDING", createdAt: new Date() })
    .run();
  db.insert(supplierContacts)
    .values({
      orderId,
      familyName: "Doe",
      givenName: "Jane",
      email: "jane@example.com",
      phone: "555-1234",
    })
    .run();
  db.insert(supplierAddresses)
    .values({
      orderId,
      streetName1: "1 Main St",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      country: "USA",
    })
    .run();
  db.insert(supplierLineItems)
    .values({
      orderId,
      categoryId: "cat",
      productId: "prod",
      itemId: "i1",
      lineNum: 1,
      quantity: 2,
      unitPrice: 1999,
      quantityShipped: 0,
    })
    .run();
}

describe("getSupplierOrder", () => {
  /** SWHR-R-0071.01 */
  it("[SWHR-C-0131] returns the order with no role or session argument in its signature", () => {
    seedOrder("1001");

    const order = getSupplierOrder("1001");

    expect(order).not.toBeNull();
    expect(order?.orderId).toBe("1001");
    expect(order?.shippingInfo.familyName).toBe("Doe");
    expect(order?.lineItems).toEqual([
      {
        categoryId: "cat",
        productId: "prod",
        itemId: "i1",
        lineNum: 1,
        quantity: 2,
        unitPrice: 1999,
        quantityShipped: 0,
      },
    ]);
  });

  it("returns null for an order that does not exist", () => {
    expect(getSupplierOrder("does-not-exist")).toBeNull();
  });
});

describe("listSupplierOrders", () => {
  it("returns every persisted supplier order", () => {
    seedOrder("1001");
    seedOrder("1002");

    const orders = listSupplierOrders();

    expect(orders.map((order) => order.orderId).sort()).toEqual(["1001", "1002"]);
  });
});
