import type { Element } from "@xmldom/xmldom";
import { describe, expect, it } from "vitest";

import { parseDocument } from "../xml/parse";
import { buildPartnerInvoice, type PartnerInvoice, TPA_INVOICE_NAMESPACE } from "./tpaInvoice";

const INVOICE: PartnerInvoice = {
  orderId: "1001",
  userId: "j2ee",
  orderDate: new Date(2002, 2, 15, 9, 0),
  shippingDate: new Date(2002, 2, 16, 9, 5),
  lineItems: [
    {
      categoryId: "cat-1",
      productId: "prod-1",
      itemId: "EST-1",
      lineNum: 1,
      quantity: 2,
      unitPrice: "19.99",
    },
    {
      categoryId: "cat-2",
      productId: "prod-2",
      itemId: "EST-2",
      lineNum: 2,
      quantity: 1,
      unitPrice: "9.99",
    },
  ],
};

function directChildNames(xml: string): string[] {
  const root = parseDocument(xml).documentElement!;
  const names: string[] = [];
  for (let i = 0; i < root.childNodes.length; i++) {
    const node = root.childNodes[i];
    if (node.nodeType === 1) {
      names.push((node as Element).localName ?? "");
    }
  }
  return names;
}

describe("buildPartnerInvoice", () => {
  /** SWHR-R-0037.01 */
  it("[SWHR-C-0073] carries OrderId, UserId, OrderDate, ShippingDate and two line items, in order", () => {
    const xml = buildPartnerInvoice(INVOICE, { form: "dtd" });
    const root = parseDocument(xml).documentElement!;

    expect(root.localName).toBe("Invoice");
    expect(root.namespaceURI).toBe(TPA_INVOICE_NAMESPACE);
    expect(directChildNames(xml)).toEqual([
      "OrderId",
      "UserId",
      "OrderDate",
      "ShippingDate",
      "LineItem",
      "LineItem",
    ]);

    const reader = parseDocument(xml).documentElement!;
    const orderId = reader.getElementsByTagName("OrderId")[0];
    const userId = reader.getElementsByTagName("UserId")[0];
    expect(orderId.textContent).toBe("1001");
    expect(userId.textContent).toBe("j2ee");
  });

  /** SWHR-R-0041.01 */
  it("[SWHR-C-0079] writes ShippingDate as 2002-03-16 with no time component", () => {
    const xml = buildPartnerInvoice(INVOICE, { form: "dtd" });
    expect(xml).toMatch(/<ShippingDate[^>]*>2002-03-16<\/ShippingDate>/);
  });

  /** SWHR-R-0042.01 */
  it("[SWHR-C-0080] fails naming UserId when building without a user id", () => {
    expect(() =>
      buildPartnerInvoice({ ...INVOICE, userId: undefined as unknown as string }, { form: "dtd" }),
    ).toThrow(/UserId/);
  });

  it("defaults locale to en_US and declares the TPA-Invoice document type in DTD form", () => {
    const xml = buildPartnerInvoice(INVOICE, { form: "dtd" });
    const root = parseDocument(xml).documentElement!;
    expect(root.getAttribute("locale")).toBe("en_US");
    expect(xml).toContain("<!DOCTYPE Invoice PUBLIC");
  });

  it("declares no document type and no locale attribute in XSD form", () => {
    const xml = buildPartnerInvoice(INVOICE, { form: "xsd" });
    const root = parseDocument(xml).documentElement!;
    expect(xml).not.toContain("<!DOCTYPE");
    expect(root.hasAttribute("locale")).toBe(false);
  });
});
