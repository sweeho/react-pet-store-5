import { afterEach, describe, expect, it } from "vitest";

import {
  readSupplierOrder,
  type SupplierOrder,
  writeSupplierOrder,
} from "../documents/supplierOrder";
import type { ContactInfo } from "../elements/contactInfo";
import { DocumentInvalidError } from "./errors";
import { intakeSupplierOrder } from "./supplierOrderIntake";
import { buildPartnerSupplierOrder } from "./tpaSupplierOrder";

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

describe("intakeSupplierOrder", () => {
  /** SWHR-R-0036.01 */
  it("[SWHR-C-0071] converts a partner-format order to an internal supplier order with the same fields", async () => {
    const xml = buildPartnerSupplierOrder(ORDER, { form: "dtd" });
    const result = await intakeSupplierOrder(xml);
    expect(result).toEqual(ORDER);
  });

  /** SWHR-R-0036.02 */
  it("[SWHR-C-0072] processes an internal SupplierOrder 1.1 document unchanged", async () => {
    const xml = writeSupplierOrder(ORDER);
    const [viaIntake, viaDirectRead] = await Promise.all([
      intakeSupplierOrder(xml, { log: () => {} }),
      readSupplierOrder(xml, { log: () => {} }),
    ]);
    expect(viaIntake).toEqual(viaDirectRead);
  });

  it("converts a partner-format order carrying only the TPASupplierOrder namespace (XSD form)", async () => {
    const xml = buildPartnerSupplierOrder(ORDER, { form: "xsd" });
    const result = await intakeSupplierOrder(xml);
    expect(result.orderId).toBe("2001");
    expect(result.lineItems).toHaveLength(2);
  });

  it("rejects an invalid partner-format order with DocumentInvalidError (SWHR-R-0047)", async () => {
    const xml = buildPartnerSupplierOrder(ORDER, { form: "dtd" }).replace(
      'quantity="2"',
      'quantity="0"',
    );
    await expect(intakeSupplierOrder(xml)).rejects.toThrow(DocumentInvalidError);
  });

  describe("validation switch", () => {
    const ORIGINAL = process.env.B2B_VALIDATE_SUPPLIER_ORDER;

    afterEach(() => {
      if (ORIGINAL === undefined) {
        delete process.env.B2B_VALIDATE_SUPPLIER_ORDER;
      } else {
        process.env.B2B_VALIDATE_SUPPLIER_ORDER = ORIGINAL;
      }
    });

    it("processes an invalid partner-format order without validating when disabled", async () => {
      process.env.B2B_VALIDATE_SUPPLIER_ORDER = "false";
      const xml = buildPartnerSupplierOrder(ORDER, { form: "dtd" }).replace(
        'quantity="2"',
        'quantity="0"',
      );
      await expect(intakeSupplierOrder(xml)).resolves.toMatchObject({ orderId: "2001" });
    });
  });
});
