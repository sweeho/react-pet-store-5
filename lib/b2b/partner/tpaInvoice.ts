import { getSchemaForm } from "../config";
import type { LineItem } from "../elements/lineItem";
import { appendTextElement, createDocument } from "../xml/build";
import { formatDocumentDate } from "../xml/dates";
import { serializeDocument } from "../xml/serialize";
import { writeTPALineItem } from "./tpaLineItem";

export const TPA_INVOICE_NAMESPACE = "http://blueprints.j2ee.sun.com/TPAInvoice";
export const TPA_INVOICE_PUBLIC_ID =
  "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD TPA-Invoice 1.0//EN";
const TPA_INVOICE_SYSTEM_ID = "http://blueprints.j2ee.sun.com/TPAInvoice.dtd";

// R5: `locale` is fixed at this default, and only exists in the DTD-declared
// form — the XSD-declared form has no locale attribute.
const TPA_INVOICE_DEFAULT_LOCALE = "en_US";

export interface PartnerInvoice {
  orderId: string;
  userId: string;
  orderDate: Date;
  shippingDate: Date;
  lineItems: LineItem[];
}

/**
 * SWHR-R-0037: root `Invoice` in the TPAInvoice namespace, carrying — in
 * order — `OrderId`, `UserId`, `OrderDate`, `ShippingDate` and one or more
 * `LineItem` (TPALineItem namespace), with no wrapping element around the
 * line items (SWHR-R-0041: dates are calendar dates, no time of day). DTD
 * form declares the TPA-Invoice document type and its `locale` attribute
 * (R5); XSD form declares neither.
 */
export function buildPartnerInvoice(
  invoice: PartnerInvoice,
  opts?: { form?: "dtd" | "xsd" },
): string {
  const doc = createDocument("Invoice", TPA_INVOICE_NAMESPACE);
  const root = doc.documentElement!;
  const form = opts?.form ?? getSchemaForm();

  if (form === "dtd") {
    root.setAttribute("locale", TPA_INVOICE_DEFAULT_LOCALE);
  }

  appendTextElement(root, "OrderId", invoice.orderId, TPA_INVOICE_NAMESPACE);
  appendTextElement(root, "UserId", invoice.userId, TPA_INVOICE_NAMESPACE);
  appendTextElement(
    root,
    "OrderDate",
    formatDocumentDate(invoice.orderDate),
    TPA_INVOICE_NAMESPACE,
  );
  appendTextElement(
    root,
    "ShippingDate",
    formatDocumentDate(invoice.shippingDate),
    TPA_INVOICE_NAMESPACE,
  );
  for (const item of invoice.lineItems) {
    writeTPALineItem(root, item);
  }

  return serializeDocument(
    doc,
    form === "dtd"
      ? { name: "Invoice", publicId: TPA_INVOICE_PUBLIC_ID, systemId: TPA_INVOICE_SYSTEM_ID }
      : undefined,
  );
}
