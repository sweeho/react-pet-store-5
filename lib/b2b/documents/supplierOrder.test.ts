import type { Element } from "@xmldom/xmldom";
import { describe, expect, it } from "vitest";

import type { ContactInfo } from "../elements/contactInfo";
import { parseDocument } from "../xml/parse";
import { readSupplierOrder, type SupplierOrder, writeSupplierOrder } from "./supplierOrder";

const CONTACT: ContactInfo = {
  familyName: "Doe",
  givenName: "Jane",
  address: {
    streetName1: "1 Main St",
    streetName2: null,
    city: "Springfield",
    state: "IL",
    zipCode: "62701",
    country: "USA",
  },
  email: "jane@example.com",
  phone: "555-1234",
};

const ORDER: SupplierOrder = {
  orderId: "2001",
  orderDate: new Date(2002, 2, 15),
  shippingInfo: CONTACT,
  lineItems: [
    {
      categoryId: "cat",
      productId: "prod",
      itemId: "item1",
      lineNum: 1,
      quantity: 1,
      unitPrice: "19.99",
    },
    {
      categoryId: "cat",
      productId: "prod",
      itemId: "item2",
      lineNum: 2,
      quantity: 1,
      unitPrice: "19.99",
    },
    {
      categoryId: "cat",
      productId: "prod",
      itemId: "item3",
      lineNum: 3,
      quantity: 1,
      unitPrice: "19.99",
    },
  ],
};

function directChildNames(xml: string): string[] {
  const root = parseDocument(xml).documentElement!;
  const names: string[] = [];
  for (let i = 0; i < root.childNodes.length; i++) {
    const node = root.childNodes[i];
    if (node.nodeType === 1) {
      names.push((node as Element).tagName);
    }
  }
  return names;
}

describe("writeSupplierOrder / readSupplierOrder", () => {
  it("round-trips every field", async () => {
    const xml = writeSupplierOrder(ORDER);
    const read = await readSupplierOrder(xml, { log: () => {} });
    expect(read).toEqual(ORDER);
  });

  /** SWHR-R-0033.01 */
  it("[SWHR-C-0066] rejects a PurchaseOrder document read as a supplier order", async () => {
    const xml = '<PurchaseOrder locale="en_US"><OrderId>1</OrderId></PurchaseOrder>';
    await expect(readSupplierOrder(xml, { log: () => {} })).rejects.toThrow(
      "SupplierOrder element expected.",
    );
  });

  /** SWHR-R-0033.02 */
  it("[SWHR-C-0067] writes children in schema order for three line items", () => {
    const xml = writeSupplierOrder(ORDER);
    expect(directChildNames(xml)).toEqual([
      "OrderId",
      "OrderDate",
      "ShippingInfo",
      "LineItem",
      "LineItem",
      "LineItem",
    ]);
    expect(parseDocument(xml).documentElement!.tagName).toBe("SupplierOrder");
  });

  /** SWHR-R-0034.01 */
  it("[SWHR-C-0068] falls back to the current date for OrderDate 'not-a-date', other fields still populated", async () => {
    const xml = writeSupplierOrder(ORDER).replace(
      "<OrderDate>2002-03-15</OrderDate>",
      "<OrderDate>not-a-date</OrderDate>",
    );
    const frozen = new Date(2030, 0, 1);
    const read = await readSupplierOrder(xml, { now: () => frozen, log: () => {} });
    expect(read.orderDate).toEqual(frozen);
    expect(read.orderId).toBe("2001");
    expect(read.lineItems).toHaveLength(3);
  });

  it("throws MalformedDocumentError for an unclosed element", async () => {
    await expect(readSupplierOrder("<SupplierOrder><OrderId>1</OrderId>")).rejects.toThrow();
  });
});
