import type { Element } from "@xmldom/xmldom";

import { getSchemaForm } from "../config";
import type { SupplierOrder } from "../documents/supplierOrder";
import type { ContactInfo } from "../elements/contactInfo";
import { appendTextElement, createDocument } from "../xml/build";
import { formatDocumentDate } from "../xml/dates";
import { ChildReader } from "../xml/read";
import { serializeDocument } from "../xml/serialize";
import { writeTPALineItem } from "./tpaLineItem";

export const TPA_SUPPLIER_ORDER_NAMESPACE = "http://blueprints.j2ee.sun.com/TPASupplierOrder";
export const TPA_SUPPLIER_ORDER_PUBLIC_ID =
  "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD TPA-SupplierOrder 1.0//EN";
const TPA_SUPPLIER_ORDER_SYSTEM_ID = "http://blueprints.j2ee.sun.com/TPASupplierOrder.dtd";

function writeShippingAddress(parent: Element, contact: ContactInfo): void {
  const doc = parent.ownerDocument;
  if (!doc) {
    throw new Error("ShippingAddress: parent element has no owner document.");
  }
  const el = doc.createElementNS(TPA_SUPPLIER_ORDER_NAMESPACE, "ShippingAddress");
  parent.appendChild(el);

  appendTextElement(el, "FirstName", contact.givenName, TPA_SUPPLIER_ORDER_NAMESPACE);
  appendTextElement(el, "LastName", contact.familyName, TPA_SUPPLIER_ORDER_NAMESPACE);
  appendTextElement(el, "Street", contact.address.streetName1, TPA_SUPPLIER_ORDER_NAMESPACE);
  appendTextElement(el, "City", contact.address.city ?? "", TPA_SUPPLIER_ORDER_NAMESPACE);
  appendTextElement(el, "State", contact.address.state ?? "", TPA_SUPPLIER_ORDER_NAMESPACE);
  appendTextElement(el, "Country", contact.address.country ?? "", TPA_SUPPLIER_ORDER_NAMESPACE);
  appendTextElement(el, "ZipCode", contact.address.zipCode ?? "", TPA_SUPPLIER_ORDER_NAMESPACE);
  appendTextElement(el, "Email", contact.email, TPA_SUPPLIER_ORDER_NAMESPACE);
  appendTextElement(el, "Phone", contact.phone, TPA_SUPPLIER_ORDER_NAMESPACE);
}

/**
 * SWHR-R-0036: the inverse of `writeShippingAddress`, mapping the nine flat
 * fields back onto a `ContactInfo` (street line 2 is never sent, R6, so it
 * always reads back `null`).
 */
export function readShippingAddress(el: Element): ContactInfo {
  const reader = new ChildReader(el);

  const firstName = reader.text("FirstName", { allowEmpty: true });
  const lastName = reader.text("LastName", { allowEmpty: true });
  const street = reader.text("Street", { allowEmpty: true });
  const city = reader.text("City", { allowEmpty: true });
  const state = reader.text("State", { allowEmpty: true });
  const country = reader.text("Country", { allowEmpty: true });
  const zipCode = reader.text("ZipCode", { allowEmpty: true });
  const email = reader.text("Email", { allowEmpty: true });
  const phone = reader.text("Phone", { allowEmpty: true });
  reader.end();

  return {
    familyName: lastName,
    givenName: firstName,
    address: { streetName1: street, streetName2: null, city, state, zipCode, country },
    email,
    phone,
  };
}

/**
 * SWHR-R-0035: root `SupplierOrder` in the TPASupplierOrder namespace,
 * carrying — in order — `OrderId`, `OrderDate`, `ShippingAddress` (nine
 * flat fields; `Street` carries `streetName1` only, R6) and one or more
 * `LineItem` (TPALineItem namespace), with no wrapping element around the
 * line items. DTD form declares the TPA-SupplierOrder document type
 * (SWHR-R-0044); XSD form declares none (SWHR-R-0044.02).
 */
export function buildPartnerSupplierOrder(
  order: SupplierOrder,
  opts?: { form?: "dtd" | "xsd" },
): string {
  const doc = createDocument("SupplierOrder", TPA_SUPPLIER_ORDER_NAMESPACE);
  const root = doc.documentElement!;

  appendTextElement(root, "OrderId", order.orderId, TPA_SUPPLIER_ORDER_NAMESPACE);
  appendTextElement(
    root,
    "OrderDate",
    formatDocumentDate(order.orderDate),
    TPA_SUPPLIER_ORDER_NAMESPACE,
  );
  writeShippingAddress(root, order.shippingInfo);
  for (const item of order.lineItems) {
    writeTPALineItem(root, item);
  }

  const form = opts?.form ?? getSchemaForm();
  return serializeDocument(
    doc,
    form === "dtd"
      ? {
          name: "SupplierOrder",
          publicId: TPA_SUPPLIER_ORDER_PUBLIC_ID,
          systemId: TPA_SUPPLIER_ORDER_SYSTEM_ID,
        }
      : undefined,
  );
}
