import { afterEach, describe, expect, it } from "vitest";

import { buildPartnerSupplierOrder } from "../partner/tpaSupplierOrder";
import { validateDocument } from "../xml/validate";
import { BUNDLED_SCHEMA_CATALOG } from "./catalog";

function publicId(name: string): string {
  const id = BUNDLED_SCHEMA_CATALOG.find((entry) => entry.file === `${name}.dtd.xsd`)?.identifier;
  if (!id) {
    throw new Error(`No catalog entry for ${name}.dtd.xsd`);
  }
  return id;
}

const CONTACT = {
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

const ORDER = {
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
  ],
};

describe("bundled TPA-SupplierOrder DTD-equivalent XSD", () => {
  it("validates a well-formed partner supplier order", async () => {
    const xml = buildPartnerSupplierOrder(ORDER, { form: "dtd" });
    expect(await validateDocument(xml, publicId("TPASupplierOrder"))).toEqual({
      valid: true,
      errors: [],
    });
  });

  /** SWHR-R-0039.01 */
  it("[SWHR-C-0076] accepts a line item with unit price 0.0", async () => {
    const xml = buildPartnerSupplierOrder(
      { ...ORDER, lineItems: [{ ...ORDER.lineItems[0], unitPrice: "0.0" }] },
      { form: "dtd" },
    );
    const result = await validateDocument(xml, publicId("TPASupplierOrder"));
    expect(result).toEqual({ valid: true, errors: [] });
  });

  /** SWHR-R-0039.02 */
  it("[SWHR-C-0077] reports a line item with quantity 0 as invalid", async () => {
    const xml = buildPartnerSupplierOrder(
      { ...ORDER, lineItems: [{ ...ORDER.lineItems[0], quantity: 0 }] },
      { form: "dtd" },
    );
    const result = await validateDocument(xml, publicId("TPASupplierOrder"));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("quantity"))).toBe(true);
  });

  /** SWHR-R-0040.01 */
  it("[SWHR-C-0078] reports a duplicate item id across two line items as invalid", async () => {
    const xml = buildPartnerSupplierOrder(
      {
        ...ORDER,
        lineItems: [
          { ...ORDER.lineItems[0], itemId: "EST-1" },
          { ...ORDER.lineItems[0], itemId: "EST-1", lineNum: 2 },
        ],
      },
      { form: "dtd" },
    );
    const result = await validateDocument(xml, publicId("TPASupplierOrder"));
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("SWHR-R-0044.02: schema form selected", () => {
  const ORIGINAL_FORM = process.env.B2B_SCHEMA_FORM;

  afterEach(() => {
    if (ORIGINAL_FORM === undefined) {
      delete process.env.B2B_SCHEMA_FORM;
    } else {
      process.env.B2B_SCHEMA_FORM = ORIGINAL_FORM;
    }
  });

  /** SWHR-R-0044.02 */
  it("[SWHR-C-0084] produces a partner order with no DOCTYPE, validated by the partner XML Schema", async () => {
    process.env.B2B_SCHEMA_FORM = "xsd";

    const xml = buildPartnerSupplierOrder(ORDER);
    expect(xml).not.toContain("<!DOCTYPE");

    const result = await validateDocument(xml, "http://blueprints.j2ee.sun.com/TPASupplierOrder");
    expect(result).toEqual({ valid: true, errors: [] });
  });
});
