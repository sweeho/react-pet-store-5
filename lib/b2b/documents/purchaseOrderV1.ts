import { isValidationEnabled } from "../config";
import type { Address } from "../elements/address";
import type { ContactInfo } from "../elements/contactInfo";
import { readCreditCard } from "../elements/creditCard";
import { readLineItem } from "../elements/lineItem";
import { parseDocumentDate } from "../xml/dates";
import { checkDocumentType } from "../xml/doctype";
import { parseDocument } from "../xml/parse";
import { ChildReader, expectRoot } from "../xml/read";
import { validateDocument } from "../xml/validate";
import type { PurchaseOrder, ReadOptions } from "./purchaseOrder";

export const PURCHASE_ORDER_V1_PUBLIC_ID =
  "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD PurchaseOrder 1.0//EN";

/**
 * Reads a `ShipToAddress`/`BillToAddress` wrapper (design.md SD-6
 * reconstruction: `FirstName`, `LastName`, `Street`, `City`, `State`,
 * `Country`, `ZipCode`) into a `ContactInfo`, with empty email and phone —
 * the 1.0 format carries neither.
 */
function readV1Address(reader: ChildReader, wrapperName: string): ContactInfo {
  const wrapperEl = reader.element(wrapperName);
  const inner = new ChildReader(wrapperEl);

  const givenName = inner.text("FirstName");
  const familyName = inner.text("LastName");
  const streetName1 = inner.text("Street");
  const city = inner.text("City");
  const state = inner.text("State");
  const country = inner.text("Country");
  const zipCode = inner.text("ZipCode");
  inner.end();

  const address: Address = {
    streetName1,
    streetName2: null,
    city,
    state,
    zipCode,
    country,
  };

  return { familyName, givenName, address, email: "", phone: "" };
}

/**
 * SWHR-R-0052 (design.md SD-6, confidence: low — the 1.0 element names are
 * reconstructed, not recovered; retaining this format awaits ruling Q1 in
 * SWHR-T-0035). Reads a version 1.0 purchase order into the same
 * `PurchaseOrder` shape `readPurchaseOrder` produces: ship-to/bill-to
 * addresses map into `ContactInfo`, credit card and line items reuse the
 * 1.1 element readers unchanged, and `locale` defaults to `en_US` when
 * absent.
 */
export async function readPurchaseOrderV1(xml: string, opts?: ReadOptions): Promise<PurchaseOrder> {
  const doc = parseDocument(xml);
  const validate = opts?.validate ?? isValidationEnabled("purchaseOrder");
  const log = opts?.log ?? ((msg: string) => console.error(msg));

  if (validate) {
    checkDocumentType(doc, PURCHASE_ORDER_V1_PUBLIC_ID);
    const result = await validateDocument(xml, PURCHASE_ORDER_V1_PUBLIC_ID);
    if (!result.valid) {
      for (const error of result.errors) {
        log(error);
      }
    }
  }

  const root = doc.documentElement!;
  expectRoot(root, "PurchaseOrder");

  const locale = root.getAttribute("locale") || "en_US";
  const reader = new ChildReader(root);

  const orderId = reader.text("OrderId");
  const userId = reader.text("UserId");
  const emailId = reader.text("EmailId");

  const orderDateText = reader.optionalText("OrderDate");
  const now = opts?.now ?? (() => new Date());
  const orderDate = parseDocumentDate(orderDateText) ?? now();

  const shippingInfo = readV1Address(reader, "ShipToAddress");
  const billingInfo = readV1Address(reader, "BillToAddress");

  const totalPrice = reader.optionalText("TotalPrice") ?? "";

  const creditCard = readCreditCard(reader.element("CreditCard"));
  const lineItems = reader.elements("LineItem", 1).map(readLineItem);
  reader.end();

  return {
    locale,
    orderId,
    userId,
    emailId,
    orderDate,
    shippingInfo,
    billingInfo,
    totalPrice,
    creditCard,
    lineItems,
  };
}
