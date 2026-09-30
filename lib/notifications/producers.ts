import { readOrderApproval } from "../b2b/documents/orderApproval";
import { readPartnerInvoice } from "../b2b/partner/invoiceIntake";
import { renderCustomerEmail, type CustomerEmailKind } from "../email/render";
import type { EmailOrderLine } from "../email/types";
import type { Handler, Tx } from "../messaging/outbox";
import { OrderNotFoundError } from "../orders/errors";
import { minorToDecimal } from "../orders/money";
import { getStoredOrder, type StoredOrder } from "../orders/store";
import type { NotificationSwitches } from "./config";
import { enqueueMail } from "./mailRequest";

const NO_OP: (tx: Tx) => void = () => {};

function loadOrder(tx: Tx, orderId: string): StoredOrder {
  const stored = getStoredOrder(orderId, tx);
  if (!stored) throw new OrderNotFoundError(orderId);
  return stored;
}

function emailLine(order: StoredOrder, line: StoredOrder["lines"][number], quantity: number) {
  return {
    categoryId: line.categoryId,
    productId: line.productId,
    itemId: line.itemId,
    quantity,
    unitPrice: Number(minorToDecimal(line.unitPrice, order.locale)),
  } satisfies EmailOrderLine;
}

function queueEmail(
  tx: Tx,
  kind: CustomerEmailKind,
  order: StoredOrder,
  lines: EmailOrderLine[],
  decision?: "APPROVED" | "DENIED",
): void {
  const email = renderCustomerEmail(kind, {
    orderId: order.orderId,
    locale: order.locale,
    lines,
    decision,
  });
  enqueueMail(tx, { recipient: order.emailId, subject: email.subject, body: email.body });
}

/** Consumer for `opc.approval-notice`: one e-mail per decided order. */
export function createApprovalNoticeHandler(switches: NotificationSwitches): Handler {
  return async (payload) => {
    const entries = await readOrderApproval(payload);
    if (!switches.approval) return NO_OP;
    return (tx) => {
      for (const entry of entries) {
        const order = loadOrder(tx, entry.orderId);
        queueEmail(tx, "approval", order, [], entry.status);
      }
    };
  };
}

/** Consumer for `opc.invoice`: one e-mail listing the invoiced lines (SD-7). */
export function createShipmentNoticeHandler(switches: NotificationSwitches): Handler {
  return async (payload) => {
    const invoice = await readPartnerInvoice(payload);
    if (!switches.shipment) return NO_OP;
    return (tx) => {
      const order = loadOrder(tx, invoice.orderId);
      const lines = order.lines
        .filter((l) => Object.hasOwn(invoice.shipped, l.itemId))
        .map((l) => emailLine(order, l, invoice.shipped[l.itemId]!));
      if (lines.length === 0) return;
      queueEmail(tx, "shipment", order, lines);
    };
  };
}

/** Consumer for `opc.completed-order`: one e-mail listing every line at its ordered quantity. */
export function createCompletedNoticeHandler(switches: NotificationSwitches): Handler {
  return async (payload) => {
    if (!switches.completed) return NO_OP;
    return (tx) => {
      const order = loadOrder(tx, payload);
      queueEmail(
        tx,
        "completed",
        order,
        order.lines.map((l) => emailLine(order, l, l.quantity)),
      );
    };
  };
}
