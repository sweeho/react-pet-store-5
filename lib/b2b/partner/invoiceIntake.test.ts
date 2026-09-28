import { afterEach, describe, expect, it, vi } from "vitest";

import { PURCHASE_ORDER_PUBLIC_ID, readPurchaseOrder } from "../documents/purchaseOrder";
import { writeSupplierOrder, type SupplierOrder } from "../documents/supplierOrder";
import type { ContactInfo } from "../elements/contactInfo";
import type { CreditCard } from "../elements/creditCard";
import * as validateModule from "../xml/validate";
import { readPartnerInvoice } from "./invoiceIntake";
import { buildPartnerInvoice, type PartnerInvoice, TPA_INVOICE_NAMESPACE } from "./tpaInvoice";

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

const CREDIT_CARD: CreditCard = {
  cardNumber: "4111111111111111",
  cardType: "Visa",
  expiryDate: "12/03",
};

const INVOICE: PartnerInvoice = {
  orderId: "1001",
  userId: "j2ee",
  orderDate: new Date(2002, 2, 15),
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

const SUPPLIER_ORDER: SupplierOrder = {
  orderId: "2001",
  orderDate: new Date(2002, 2, 15),
  shippingInfo: CONTACT,
  lineItems: [],
};

describe("readPartnerInvoice", () => {
  /** SWHR-R-0038.01 */
  it("[SWHR-C-0074] reads order 1001 and shipped quantities EST-1:2, EST-2:1", async () => {
    const xml = buildPartnerInvoice(INVOICE, { form: "dtd" });
    const result = await readPartnerInvoice(xml, { log: () => {} });
    expect(result).toEqual({ orderId: "1001", shipped: { "EST-1": 2, "EST-2": 1 } });
  });

  /** SWHR-R-0038.02 */
  it("[SWHR-C-0075] rejects a SupplierOrder document with 'Invoice element expected.'", async () => {
    const xml = writeSupplierOrder(SUPPLIER_ORDER);
    await expect(readPartnerInvoice(xml)).rejects.toThrow("Invoice element expected.");
  });

  it("rejects a well-formed document with no namespace at all", async () => {
    await expect(readPartnerInvoice("<Invoice><OrderId>1</OrderId></Invoice>")).rejects.toThrow(
      "Invoice element expected.",
    );
  });

  it("accepts a well-formed Invoice in the TPAInvoice namespace directly", async () => {
    const xml = `<?xml version="1.0"?><Invoice xmlns="${TPA_INVOICE_NAMESPACE}"><OrderId>1001</OrderId><UserId>j2ee</UserId><OrderDate>2002-03-15</OrderDate><ShippingDate>2002-03-16</ShippingDate></Invoice>`;
    await expect(readPartnerInvoice(xml, { validate: false })).rejects.toThrow(
      "LineItem element expected.",
    );
  });
});

describe("SWHR-R-0044.01: invoice validation switched off", () => {
  const ORIGINAL_INVOICE = process.env.B2B_VALIDATE_INVOICE;
  const ORIGINAL_PO = process.env.B2B_VALIDATE_PURCHASE_ORDER;

  afterEach(() => {
    if (ORIGINAL_INVOICE === undefined) {
      delete process.env.B2B_VALIDATE_INVOICE;
    } else {
      process.env.B2B_VALIDATE_INVOICE = ORIGINAL_INVOICE;
    }
    if (ORIGINAL_PO === undefined) {
      delete process.env.B2B_VALIDATE_PURCHASE_ORDER;
    } else {
      process.env.B2B_VALIDATE_PURCHASE_ORDER = ORIGINAL_PO;
    }
    vi.restoreAllMocks();
  });

  /** SWHR-R-0044.01 */
  it("[SWHR-C-0083] validates only the purchase order when invoice validation is disabled", async () => {
    process.env.B2B_VALIDATE_INVOICE = "false";
    process.env.B2B_VALIDATE_PURCHASE_ORDER = "true";

    const spy = vi.spyOn(validateModule, "validateDocument");

    const invoiceXml = buildPartnerInvoice(INVOICE, { form: "dtd" });
    await readPartnerInvoice(invoiceXml);

    const { writePurchaseOrder } = await import("../documents/purchaseOrder");
    const purchaseOrderXml = writePurchaseOrder({
      locale: "en_US",
      orderId: "1001",
      userId: "j2ee",
      emailId: "j2ee@example.com",
      orderDate: new Date(2002, 2, 15),
      shippingInfo: CONTACT,
      billingInfo: CONTACT,
      totalPrice: "39.98",
      creditCard: CREDIT_CARD,
      lineItems: INVOICE.lineItems,
    });
    await readPurchaseOrder(purchaseOrderXml);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(purchaseOrderXml, PURCHASE_ORDER_PUBLIC_ID);
  });
});
