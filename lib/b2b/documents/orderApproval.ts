import { isValidationEnabled } from "../config";
import { appendTextElement, createDocument } from "../xml/build";
import { checkDocumentType } from "../xml/doctype";
import { DocumentReadError } from "../xml/errors";
import { parseDocument } from "../xml/parse";
import { ChildReader, expectRoot } from "../xml/read";
import { serializeDocument } from "../xml/serialize";
import { validateDocument } from "../xml/validate";
import type { ReadOptions } from "./purchaseOrder";

export type ApprovalStatus = "APPROVED" | "DENIED";

export interface ApprovalEntry {
  orderId: string;
  status: ApprovalStatus;
}

export const ORDER_APPROVAL_PUBLIC_ID =
  "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD OrderApproval 1.1//EN";
const ORDER_APPROVAL_SYSTEM_ID = "http://blueprints.j2ee.sun.com/OrderApproval.dtd";

/** One `Order` (`OrderId`, `OrderStatus`) per entry, always DOCTYPE-declared. */
export function writeOrderApproval(entries: ApprovalEntry[]): string {
  if (entries.length === 0) {
    throw new Error("OrderApproval requires at least one order.");
  }
  const doc = createDocument("OrderApproval");
  const root = doc.documentElement!;

  for (const entry of entries) {
    const order = doc.createElement("Order");
    root.appendChild(order);
    appendTextElement(order, "OrderId", entry.orderId);
    appendTextElement(order, "OrderStatus", entry.status);
  }

  return serializeDocument(doc, {
    name: "OrderApproval",
    publicId: ORDER_APPROVAL_PUBLIC_ID,
    systemId: ORDER_APPROVAL_SYSTEM_ID,
  });
}

function toStatus(value: string): ApprovalStatus {
  if (value === "APPROVED" || value === "DENIED") {
    return value;
  }
  throw new DocumentReadError(`OrderStatus element: APPROVED or DENIED expected, got "${value}".`);
}

/**
 * Parse → (when validation is on) `checkDocumentType` and `validateDocument`,
 * logging and continuing → then the content model is ALWAYS enforced, so a
 * malformed batch fails the read whatever the switch says (design.md SD-3).
 */
export async function readOrderApproval(xml: string, opts?: ReadOptions): Promise<ApprovalEntry[]> {
  const doc = parseDocument(xml);
  const validate = opts?.validate ?? isValidationEnabled("orderApproval");
  const log = opts?.log ?? ((msg: string) => console.error(msg));

  if (validate) {
    checkDocumentType(doc, ORDER_APPROVAL_PUBLIC_ID);
    const result = await validateDocument(xml, ORDER_APPROVAL_PUBLIC_ID);
    if (!result.valid) {
      for (const error of result.errors) {
        log(error);
      }
    }
  }

  const root = doc.documentElement!;
  expectRoot(root, "OrderApproval");

  const reader = new ChildReader(root);
  const entries = reader.elements("Order", 1).map((orderEl): ApprovalEntry => {
    const orderReader = new ChildReader(orderEl);
    const orderId = orderReader.text("OrderId");
    const status = toStatus(orderReader.text("OrderStatus"));
    orderReader.end();
    return { orderId, status };
  });
  reader.end();

  return entries;
}
