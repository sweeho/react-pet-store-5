import type { Element } from "@xmldom/xmldom";
import { afterEach, describe, expect, it } from "vitest";

import type { ContactInfo } from "../elements/contactInfo";
import { parseDocument } from "../xml/parse";
import { validateDocument } from "../xml/validate";
import {
  PURCHASE_ORDER_PUBLIC_ID,
  type PurchaseOrder,
  readPurchaseOrder,
  writePurchaseOrder,
} from "./purchaseOrder";
import { SUPPLIER_ORDER_PUBLIC_ID } from "./supplierOrder";

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

const ORDER: PurchaseOrder = {
  locale: "en_US",
  orderId: "1001",
  userId: "j2ee",
  emailId: "j2ee@example.com",
  orderDate: new Date(2002, 2, 15, 14, 32),
  shippingInfo: CONTACT,
  billingInfo: CONTACT,
  totalPrice: "39.98",
  creditCard: { cardNumber: "4111111111111111", cardType: "Visa", expiryDate: "12/03" },
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

describe("writePurchaseOrder / readPurchaseOrder", () => {
  it("round-trips every field (OrderDate loses its time of day, SWHR-R-0026)", async () => {
    const xml = writePurchaseOrder(ORDER);
    const read = await readPurchaseOrder(xml, { log: () => {} });
    expect(read).toEqual({ ...ORDER, orderDate: new Date(2002, 2, 15) });
  });

  /** SWHR-R-0024.01 */
  it("[SWHR-C-0047] writes children in schema order for two line items", () => {
    const xml = writePurchaseOrder(ORDER);
    expect(directChildNames(xml)).toEqual([
      "OrderId",
      "UserId",
      "EmailId",
      "OrderDate",
      "ShippingInfo",
      "BillingInfo",
      "TotalPrice",
      "CreditCard",
      "LineItem",
      "LineItem",
    ]);
    expect(parseDocument(xml).documentElement!.tagName).toBe("PurchaseOrder");
  });

  /** SWHR-R-0024.02 */
  it("[SWHR-C-0048] reads a document with no locale attribute as en_US", async () => {
    const xml = writePurchaseOrder(ORDER).replace(' locale="en_US"', "");
    const read = await readPurchaseOrder(xml, { log: () => {} });
    expect(read.locale).toBe("en_US");
  });

  /** SWHR-R-0024.03 */
  it("[SWHR-C-0049] reports a purchase order with no LineItem as invalid", async () => {
    const xml = writePurchaseOrder({ ...ORDER, lineItems: [] });
    const result = await validateDocument(xml, PURCHASE_ORDER_PUBLIC_ID);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("LineItem"))).toBe(true);
  });

  /** SWHR-R-0025.01 */
  it("[SWHR-C-0050] rejects a SupplierOrder document read as a purchase order", async () => {
    const xml = "<SupplierOrder><OrderId>1</OrderId></SupplierOrder>";
    await expect(readPurchaseOrder(xml, { log: () => {} })).rejects.toThrow(
      "PurchaseOrder element expected.",
    );
  });

  /** SWHR-R-0026.01 */
  it("[SWHR-C-0051] writes OrderDate as 2002-03-15 with no time component", () => {
    const xml = writePurchaseOrder(ORDER);
    expect(xml).toContain("<OrderDate>2002-03-15</OrderDate>");
  });

  /** SWHR-R-0026.02 */
  it("[SWHR-C-0052] falls back to the current date for an unparseable OrderDate, other fields still populated", async () => {
    const xml = writePurchaseOrder(ORDER).replace(
      "<OrderDate>2002-03-15</OrderDate>",
      "<OrderDate>15/03/2002</OrderDate>",
    );
    const frozen = new Date(2030, 0, 1);
    const read = await readPurchaseOrder(xml, { now: () => frozen, log: () => {} });
    expect(read.orderDate).toEqual(frozen);
    expect(read.orderId).toBe("1001");
    expect(read.lineItems).toHaveLength(2);
  });

  /** SWHR-R-0043.01 */
  it("[SWHR-C-0082] encodes a non-ASCII family name as UTF-8", () => {
    const xml = writePurchaseOrder({
      ...ORDER,
      shippingInfo: { ...CONTACT, familyName: "Müller" },
    });
    expect(xml).toContain('encoding="UTF-8"');
    const bytes = Buffer.from(xml, "utf-8");
    expect(bytes.includes(Buffer.from([0xc3, 0xbc]))).toBe(true);
    expect(bytes.toString("utf-8")).toContain("Müller");
  });

  /** SWHR-R-0045.01, proven through readPurchaseOrder per PLAN.md */
  it("[SWHR-C-0085] rejects a document declaring the SupplierOrder 1.1 type", async () => {
    const xml =
      `<?xml version="1.0"?>\n<!DOCTYPE PurchaseOrder PUBLIC "${SUPPLIER_ORDER_PUBLIC_ID}" "x">\n` +
      writePurchaseOrder(ORDER).split("\n").slice(2).join("\n");
    await expect(readPurchaseOrder(xml, { log: () => {} })).rejects.toThrow(
      /^Document not of type/,
    );
  });

  /** SWHR-R-0045.02, proven through readPurchaseOrder per PLAN.md */
  it("[SWHR-C-0086] passes the document type check for a document with no DOCTYPE", async () => {
    const xml = writePurchaseOrder(ORDER).replace(/<!DOCTYPE[^>]*>\n/, "");
    await expect(readPurchaseOrder(xml, { log: () => {} })).resolves.toMatchObject({
      orderId: "1001",
    });
  });

  /** SWHR-R-0046.02, proven through readPurchaseOrder per PLAN.md */
  it("[SWHR-C-0088] logs a violation mentioning TotalPrice and continues when it is missing", async () => {
    const xml = writePurchaseOrder(ORDER).replace(/\s*<TotalPrice>39\.98<\/TotalPrice>/, "");
    const logs: string[] = [];

    const read = await readPurchaseOrder(xml, { log: (msg) => logs.push(msg) });

    expect(logs.some((msg) => msg.includes("TotalPrice"))).toBe(true);
    expect(read.totalPrice).toBe("");
    expect(read.creditCard).toEqual(ORDER.creditCard);
    expect(read.lineItems).toHaveLength(2);
  });

  it("throws MalformedDocumentError for an unclosed element", async () => {
    await expect(readPurchaseOrder("<PurchaseOrder><OrderId>1</OrderId>")).rejects.toThrow();
  });
});

describe("readPurchaseOrder validation switch", () => {
  const ORIGINAL = process.env.B2B_VALIDATE_PURCHASE_ORDER;

  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.B2B_VALIDATE_PURCHASE_ORDER;
    } else {
      process.env.B2B_VALIDATE_PURCHASE_ORDER = ORIGINAL;
    }
  });

  it("skips the document type check when validation is disabled by config", async () => {
    process.env.B2B_VALIDATE_PURCHASE_ORDER = "false";
    const xml =
      `<?xml version="1.0"?>\n<!DOCTYPE PurchaseOrder PUBLIC "${SUPPLIER_ORDER_PUBLIC_ID}" "x">\n` +
      writePurchaseOrder(ORDER).split("\n").slice(2).join("\n");

    await expect(readPurchaseOrder(xml)).resolves.toMatchObject({ orderId: "1001" });
  });

  it("skips the document type check when opts.validate is explicitly false", async () => {
    const xml =
      `<?xml version="1.0"?>\n<!DOCTYPE PurchaseOrder PUBLIC "${SUPPLIER_ORDER_PUBLIC_ID}" "x">\n` +
      writePurchaseOrder(ORDER).split("\n").slice(2).join("\n");

    await expect(readPurchaseOrder(xml, { validate: false })).resolves.toMatchObject({
      orderId: "1001",
    });
  });
});
