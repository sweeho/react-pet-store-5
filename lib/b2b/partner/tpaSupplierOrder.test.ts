import type { Element } from "@xmldom/xmldom";
import { afterEach, describe, expect, it } from "vitest";

import type { ContactInfo } from "../elements/contactInfo";
import { parseDocument } from "../xml/parse";
import {
  buildPartnerSupplierOrder,
  readShippingAddress,
  TPA_SUPPLIER_ORDER_NAMESPACE,
  TPA_SUPPLIER_ORDER_PUBLIC_ID,
} from "./tpaSupplierOrder";
import type { SupplierOrder } from "../documents/supplierOrder";

const CONTACT: ContactInfo = {
  familyName: "Doe",
  givenName: "Jane",
  address: {
    streetName1: "1 Main St",
    streetName2: "Suite 5",
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

function directChildren(xml: string): Element[] {
  const root = parseDocument(xml).documentElement!;
  const result: Element[] = [];
  for (let i = 0; i < root.childNodes.length; i++) {
    const node = root.childNodes[i];
    if (node.nodeType === 1) {
      result.push(node as Element);
    }
  }
  return result;
}

describe("buildPartnerSupplierOrder", () => {
  const ORIGINAL_FORM = process.env.B2B_SCHEMA_FORM;

  afterEach(() => {
    if (ORIGINAL_FORM === undefined) {
      delete process.env.B2B_SCHEMA_FORM;
    } else {
      process.env.B2B_SCHEMA_FORM = ORIGINAL_FORM;
    }
  });

  /** SWHR-R-0035.01 */
  it("[SWHR-C-0069] carries the order id, date, nine shipping-address fields and two line items", () => {
    const xml = buildPartnerSupplierOrder(ORDER, { form: "dtd" });
    const root = parseDocument(xml).documentElement!;

    expect(root.localName).toBe("SupplierOrder");
    expect(root.namespaceURI).toBe(TPA_SUPPLIER_ORDER_NAMESPACE);

    const children = directChildren(xml);
    expect(children.map((el) => el.localName)).toEqual([
      "OrderId",
      "OrderDate",
      "ShippingAddress",
      "LineItem",
      "LineItem",
    ]);
    expect(children[0].textContent).toBe("2001");
    expect(children[1].textContent).toBe("2002-03-15");

    const addressChildren = Array.from(
      { length: children[2].childNodes.length },
      (_, i) => children[2].childNodes[i],
    ).filter((node) => node.nodeType === 1) as Element[];
    expect(addressChildren.map((el) => el.localName)).toEqual([
      "FirstName",
      "LastName",
      "Street",
      "City",
      "State",
      "Country",
      "ZipCode",
      "Email",
      "Phone",
    ]);
    expect(addressChildren.map((el) => el.textContent)).toEqual([
      "Jane",
      "Doe",
      "1 Main St",
      "Springfield",
      "IL",
      "USA",
      "62701",
      "jane@example.com",
      "555-1234",
    ]);

    const lineItems = [children[3], children[4]];
    expect(lineItems.map((el) => el.getAttribute("itemId"))).toEqual(["EST-1", "EST-2"]);
    expect(lineItems.map((el) => el.getAttribute("categoryId"))).toEqual(["cat-1", "cat-2"]);
    expect(lineItems.map((el) => el.getAttribute("productId"))).toEqual(["prod-1", "prod-2"]);
    expect(lineItems.map((el) => el.getAttribute("lineNo"))).toEqual(["1", "2"]);
    expect(lineItems.map((el) => el.getAttribute("quantity"))).toEqual(["2", "1"]);
    expect(lineItems.map((el) => el.getAttribute("unitPrice"))).toEqual(["19.99", "9.99"]);
  });

  /** SWHR-R-0035.02 */
  it("[SWHR-C-0070] sends only the first street line", () => {
    const xml = buildPartnerSupplierOrder(ORDER, { form: "dtd" });
    expect(xml).not.toContain("Suite 5");
    const streetMatches = xml.match(/<Street[^>]*>[^<]*<\/Street>/g) ?? [];
    expect(streetMatches).toHaveLength(1);
    expect(streetMatches[0]).toContain("1 Main St");
  });

  it("declares the TPA-SupplierOrder document type in DTD form", () => {
    const xml = buildPartnerSupplierOrder(ORDER, { form: "dtd" });
    expect(xml).toContain(`<!DOCTYPE SupplierOrder PUBLIC "${TPA_SUPPLIER_ORDER_PUBLIC_ID}"`);
  });

  it("declares no document type in XSD form", () => {
    const xml = buildPartnerSupplierOrder(ORDER, { form: "xsd" });
    expect(xml).not.toContain("<!DOCTYPE");
  });

  it("defaults the form from B2B_SCHEMA_FORM when opts.form is not given", () => {
    process.env.B2B_SCHEMA_FORM = "xsd";
    expect(buildPartnerSupplierOrder(ORDER)).not.toContain("<!DOCTYPE");

    process.env.B2B_SCHEMA_FORM = "dtd";
    expect(buildPartnerSupplierOrder(ORDER)).toContain("<!DOCTYPE");
  });

  /** SWHR-R-0042.02 */
  it("[SWHR-C-0081] writes an empty Phone element for an empty phone number", () => {
    const xml = buildPartnerSupplierOrder(
      { ...ORDER, shippingInfo: { ...CONTACT, phone: "" } },
      { form: "dtd" },
    );
    const addressEl = directChildren(xml)[2];
    const phone = Array.from(
      { length: addressEl.childNodes.length },
      (_, i) => addressEl.childNodes[i],
    )
      .filter((node) => node.nodeType === 1)
      .find((node) => (node as Element).localName === "Phone") as Element;
    expect(phone.textContent).toBe("");
    expect(phone.childNodes.length).toBe(0);
  });
});

describe("readShippingAddress", () => {
  it("maps the nine flat fields back onto a ContactInfo, with streetName2 always null", () => {
    const xml = buildPartnerSupplierOrder(ORDER, { form: "dtd" });
    const addressEl = directChildren(xml)[2];
    expect(readShippingAddress(addressEl)).toEqual({
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
    });
  });
});
