import type { Element } from "@xmldom/xmldom";

import { isValidationEnabled } from "../config";
import { type ContactInfo, readContactInfo, writeContactInfo } from "../elements/contactInfo";
import { type CreditCard, readCreditCard, writeCreditCard } from "../elements/creditCard";
import { type LineItem, readLineItem, writeLineItem } from "../elements/lineItem";
import { appendTextElement, createDocument } from "../xml/build";
import { formatDocumentDate, parseDocumentDate } from "../xml/dates";
import { checkDocumentType } from "../xml/doctype";
import { parseDocument } from "../xml/parse";
import { ChildReader, expectRoot } from "../xml/read";
import { serializeDocument } from "../xml/serialize";
import { validateDocument } from "../xml/validate";

export interface PurchaseOrder {
  locale: string;
  orderId: string;
  userId: string;
  emailId: string;
  orderDate: Date;
  shippingInfo: ContactInfo;
  billingInfo: ContactInfo;
  totalPrice: string;
  creditCard: CreditCard;
  lineItems: LineItem[];
}

export interface ReadOptions {
  validate?: boolean;
  now?: () => Date;
  log?: (msg: string) => void;
}

export const PURCHASE_ORDER_PUBLIC_ID =
  "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD PurchaseOrder 1.1//EN";
const PURCHASE_ORDER_SYSTEM_ID = "http://blueprints.j2ee.sun.com/PurchaseOrder.dtd";

function writeContactWrapper(parent: Element, wrapperName: string, contact: ContactInfo): void {
  const doc = parent.ownerDocument;
  if (!doc) {
    throw new Error(`${wrapperName}: parent element has no owner document.`);
  }
  const wrapper = doc.createElement(wrapperName);
  parent.appendChild(wrapper);
  writeContactInfo(wrapper, contact);
}

function readContactWrapper(reader: ChildReader, wrapperName: string): ContactInfo {
  const wrapperEl = reader.element(wrapperName);
  const innerReader = new ChildReader(wrapperEl);
  const contact = readContactInfo(innerReader.element("ContactInfo"));
  innerReader.end();
  return contact;
}

/**
 * SWHR-R-0024: `locale` attribute (defaulting `en_US` on read) then, in
 * order, `OrderId`, `UserId`, `EmailId`, `OrderDate`, `ShippingInfo`
 * (wrapping one `ContactInfo`), `BillingInfo` (likewise), `TotalPrice`,
 * `CreditCard` and one or more `LineItem`. Always DOCTYPE-declared — unlike
 * the partner documents (SWHR-T-0031), this internal document has no
 * XML-Schema-declared form.
 */
export function writePurchaseOrder(po: PurchaseOrder): string {
  const doc = createDocument("PurchaseOrder");
  const root = doc.documentElement!;
  root.setAttribute("locale", po.locale);

  appendTextElement(root, "OrderId", po.orderId);
  appendTextElement(root, "UserId", po.userId);
  appendTextElement(root, "EmailId", po.emailId);
  appendTextElement(root, "OrderDate", formatDocumentDate(po.orderDate));
  writeContactWrapper(root, "ShippingInfo", po.shippingInfo);
  writeContactWrapper(root, "BillingInfo", po.billingInfo);
  appendTextElement(root, "TotalPrice", po.totalPrice);
  writeCreditCard(root, po.creditCard);
  for (const item of po.lineItems) {
    writeLineItem(root, item);
  }

  return serializeDocument(doc, {
    name: "PurchaseOrder",
    publicId: PURCHASE_ORDER_PUBLIC_ID,
    systemId: PURCHASE_ORDER_SYSTEM_ID,
  });
}

/**
 * Order: parse (malformed -> `MalformedDocumentError`) → when validation is
 * on, `checkDocumentType` (mismatch rejects, SWHR-R-0045) then
 * `validateDocument`, logging every violation through `opts.log` and
 * continuing rather than rejecting (SWHR-R-0046, SD-9) → the unconditional
 * root check (SWHR-R-0025) → read children. `locale` defaults to `en_US`
 * when absent; `OrderDate` and `TotalPrice` default to "now"/"" when
 * missing or unreadable rather than rejecting the document, matching the
 * same log-and-continue tolerance (design.md P3).
 */
export async function readPurchaseOrder(xml: string, opts?: ReadOptions): Promise<PurchaseOrder> {
  const doc = parseDocument(xml);
  const validate = opts?.validate ?? isValidationEnabled("purchaseOrder");
  const log = opts?.log ?? ((msg: string) => console.error(msg));

  if (validate) {
    checkDocumentType(doc, PURCHASE_ORDER_PUBLIC_ID);
    const result = await validateDocument(xml, PURCHASE_ORDER_PUBLIC_ID);
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

  const shippingInfo = readContactWrapper(reader, "ShippingInfo");
  const billingInfo = readContactWrapper(reader, "BillingInfo");

  const totalPrice = reader.optionalText("TotalPrice") ?? "";

  const creditCard = readCreditCard(reader.element("CreditCard"));
  const lineItems = reader.elements("LineItem").map(readLineItem);
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
