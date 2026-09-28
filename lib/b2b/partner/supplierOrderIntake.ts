import { isValidationEnabled } from "../config";
import { readSupplierOrder, type SupplierOrder } from "../documents/supplierOrder";
import type { ReadOptions } from "../documents/purchaseOrder";
import { parseDocumentDate } from "../xml/dates";
import { unquoteDeclaredId } from "../xml/doctype";
import { parseDocument } from "../xml/parse";
import { ChildReader, expectRoot } from "../xml/read";
import { validateDocument } from "../xml/validate";
import { DocumentInvalidError } from "./errors";
import { readTPALineItem } from "./tpaLineItem";
import {
  readShippingAddress,
  TPA_SUPPLIER_ORDER_NAMESPACE,
  TPA_SUPPLIER_ORDER_PUBLIC_ID,
} from "./tpaSupplierOrder";

/**
 * SWHR-R-0036: identifies a partner-format document by its TPASupplierOrder
 * namespace or its TPA-SupplierOrder 1.0 public identifier; anything else
 * (an internal `SupplierOrder` 1.1 document) passes through
 * `readSupplierOrder` unchanged. A partner-format document that fails
 * validation is rejected with `DocumentInvalidError` rather than logged and
 * continued — the SME ruling behind SWHR-R-0047, unlike every other
 * document type's log-and-continue tolerance (SD-9).
 */
export async function intakeSupplierOrder(xml: string, opts?: ReadOptions): Promise<SupplierOrder> {
  const doc = parseDocument(xml);
  const root = doc.documentElement!;
  const declaredPublicId = doc.doctype ? unquoteDeclaredId(doc.doctype.publicId) : null;

  const isPartnerFormat =
    root.namespaceURI === TPA_SUPPLIER_ORDER_NAMESPACE ||
    declaredPublicId === TPA_SUPPLIER_ORDER_PUBLIC_ID;

  if (!isPartnerFormat) {
    return readSupplierOrder(xml, opts);
  }

  const validate = opts?.validate ?? isValidationEnabled("supplierOrder");
  if (validate) {
    const schemaKey = declaredPublicId ?? TPA_SUPPLIER_ORDER_NAMESPACE;
    const result = await validateDocument(xml, schemaKey);
    if (!result.valid) {
      throw new DocumentInvalidError("Supplier order document failed validation.", result.errors);
    }
  }

  expectRoot(root, "SupplierOrder", TPA_SUPPLIER_ORDER_NAMESPACE);
  const reader = new ChildReader(root);

  const orderId = reader.text("OrderId");

  const orderDateText = reader.optionalText("OrderDate");
  const now = opts?.now ?? (() => new Date());
  const orderDate = parseDocumentDate(orderDateText) ?? now();

  const shippingInfo = readShippingAddress(reader.element("ShippingAddress"));
  const lineItems = reader.elements("LineItem", 1).map(readTPALineItem);
  reader.end();

  return { orderId, orderDate, shippingInfo, lineItems };
}
