import { isValidationEnabled } from "../config";
import type { ReadOptions } from "../documents/purchaseOrder";
import { unquoteDeclaredId } from "../xml/doctype";
import { parseDocument } from "../xml/parse";
import { ChildReader, expectRoot } from "../xml/read";
import { validateDocument } from "../xml/validate";
import { readTPALineItem } from "./tpaLineItem";
import { TPA_INVOICE_NAMESPACE } from "./tpaInvoice";

/**
 * SWHR-R-0038: the root check (`Invoice` in the TPAInvoice namespace) runs
 * unconditionally, before validation, so a wrong document on the invoice
 * channel is always rejected with the exact message regardless of the
 * validation switch. When validation is enabled, a schema violation is
 * logged and processing continues (SD-9 — invoices are not in the
 * SWHR-R-0047 reject list, unlike supplier orders). Reads `OrderId` and,
 * for each `LineItem` (TPALineItem namespace), its `itemId` and integer
 * `quantity`.
 */
export async function readPartnerInvoice(
  xml: string,
  opts?: ReadOptions,
): Promise<{ orderId: string; shipped: Record<string, number> }> {
  const doc = parseDocument(xml);
  const root = doc.documentElement!;
  expectRoot(root, "Invoice", TPA_INVOICE_NAMESPACE);

  const validate = opts?.validate ?? isValidationEnabled("invoice");
  const log = opts?.log ?? ((msg: string) => console.error(msg));

  if (validate) {
    const declaredPublicId = doc.doctype ? unquoteDeclaredId(doc.doctype.publicId) : null;
    const schemaKey = declaredPublicId ?? TPA_INVOICE_NAMESPACE;
    const result = await validateDocument(xml, schemaKey);
    if (!result.valid) {
      for (const error of result.errors) {
        log(error);
      }
    }
  }

  const reader = new ChildReader(root);
  const orderId = reader.text("OrderId");
  reader.optionalText("UserId");
  reader.optionalText("OrderDate");
  reader.optionalText("ShippingDate");
  const lineItems = reader.elements("LineItem", 1).map(readTPALineItem);
  reader.end();

  const shipped: Record<string, number> = {};
  for (const item of lineItems) {
    shipped[item.itemId] = item.quantity;
  }

  return { orderId, shipped };
}
