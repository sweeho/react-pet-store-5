import type { Element } from "@xmldom/xmldom";

import { isValidationEnabled } from "../config";
import { type ContactInfo, readContactInfo, writeContactInfo } from "../elements/contactInfo";
import { type LineItem, readLineItem, writeLineItem } from "../elements/lineItem";
import { appendTextElement, createDocument } from "../xml/build";
import { formatDocumentDate, parseDocumentDate } from "../xml/dates";
import { checkDocumentType } from "../xml/doctype";
import { parseDocument } from "../xml/parse";
import { ChildReader, expectRoot } from "../xml/read";
import { serializeDocument } from "../xml/serialize";
import { validateDocument } from "../xml/validate";
import type { ReadOptions } from "./purchaseOrder";

export interface SupplierOrder {
  orderId: string;
  orderDate: Date;
  shippingInfo: ContactInfo;
  lineItems: LineItem[];
}

export const SUPPLIER_ORDER_PUBLIC_ID =
  "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD SupplierOrder 1.1//EN";
const SUPPLIER_ORDER_SYSTEM_ID = "http://blueprints.j2ee.sun.com/SupplierOrder.dtd";

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
 * SWHR-R-0033: `OrderId`, `OrderDate`, `ShippingInfo` (wrapping one
 * `ContactInfo`) and one or more `LineItem`, in that order, always
 * DOCTYPE-declared.
 */
export function writeSupplierOrder(so: SupplierOrder): string {
  const doc = createDocument("SupplierOrder");
  const root = doc.documentElement!;

  appendTextElement(root, "OrderId", so.orderId);
  appendTextElement(root, "OrderDate", formatDocumentDate(so.orderDate));
  writeContactWrapper(root, "ShippingInfo", so.shippingInfo);
  for (const item of so.lineItems) {
    writeLineItem(root, item);
  }

  return serializeDocument(doc, {
    name: "SupplierOrder",
    publicId: SUPPLIER_ORDER_PUBLIC_ID,
    systemId: SUPPLIER_ORDER_SYSTEM_ID,
  });
}

/**
 * Same pattern as `readPurchaseOrder`: parse → (when validation is on)
 * `checkDocumentType` then `validateDocument`, logging and continuing
 * (SWHR-R-0046) → the unconditional root check (SWHR-R-0033) → read
 * children, with `OrderDate` defaulting to "now" when missing or
 * unparseable (SWHR-R-0034). Rejecting an invalid supplier order is
 * SWHR-T-0033's job (SWHR-R-0047) — this reader only reports and logs.
 */
export async function readSupplierOrder(xml: string, opts?: ReadOptions): Promise<SupplierOrder> {
  const doc = parseDocument(xml);
  const validate = opts?.validate ?? isValidationEnabled("supplierOrder");
  const log = opts?.log ?? ((msg: string) => console.error(msg));

  if (validate) {
    checkDocumentType(doc, SUPPLIER_ORDER_PUBLIC_ID);
    const result = await validateDocument(xml, SUPPLIER_ORDER_PUBLIC_ID);
    if (!result.valid) {
      for (const error of result.errors) {
        log(error);
      }
    }
  }

  const root = doc.documentElement!;
  expectRoot(root, "SupplierOrder");

  const reader = new ChildReader(root);

  const orderId = reader.text("OrderId");

  const orderDateText = reader.optionalText("OrderDate");
  const now = opts?.now ?? (() => new Date());
  const orderDate = parseDocumentDate(orderDateText) ?? now();

  const shippingInfo = readContactWrapper(reader, "ShippingInfo");
  const lineItems = reader.elements("LineItem").map(readLineItem);
  reader.end();

  return { orderId, orderDate, shippingInfo, lineItems };
}
