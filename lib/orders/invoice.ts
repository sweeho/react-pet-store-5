import { readPartnerInvoice } from "../b2b/partner/invoiceIntake";
import { enqueue, type Handler, type Tx } from "../messaging/outbox";
import { runStep } from "../messaging/errors";
import { OrderNotFoundError } from "./errors";
import { setShippedQuantity } from "./lines";
import { getStoredOrder } from "./store";
import { transition } from "./workflow";

/**
 * Adds each invoiced quantity to every line with that item id (F3) and
 * ignores unknown item ids. The order is COMPLETED, with one completed-order
 * notice, only when every line's shipped quantity equals its ordered
 * quantity exactly (F2); over-shipment stays SHIPPED_PART.
 */
export function applyInvoice(
  tx: Tx,
  orderId: string,
  shipped: Record<string, number>,
): "COMPLETED" | "SHIPPED_PART" {
  const stored = getStoredOrder(orderId, tx);
  if (!stored) throw new OrderNotFoundError(orderId);

  const lines = stored.lines.map((l) => {
    const invoiced = Object.hasOwn(shipped, l.itemId) ? shipped[l.itemId]! : 0;
    if (invoiced === 0) return l;
    const quantityShipped = l.quantityShipped + invoiced;
    setShippedQuantity(tx, orderId, l.lineNum, quantityShipped);
    return { ...l, quantityShipped };
  });

  if (lines.every((l) => l.quantityShipped === l.quantity)) {
    if (transition(tx, orderId, "COMPLETED")) enqueue(tx, "opc.completed-order", orderId);
    return "COMPLETED";
  }
  transition(tx, orderId, "SHIPPED_PART");
  return "SHIPPED_PART";
}

/** Consumer for `opc.invoice`; a failure retries the delivery and goes dead at the retry cap. */
export function createOrderFulfillmentHandler(): Handler {
  return async (payload) => {
    const invoice = await readPartnerInvoice(payload);
    return (tx) => {
      runStep("order-fulfillment", () => applyInvoice(tx, invoice.orderId, invoice.shipped));
    };
  };
}
