import {
  type ApprovalEntry,
  readOrderApproval,
  writeOrderApproval,
} from "../b2b/documents/orderApproval";
import type { SupplierOrder } from "../b2b/documents/supplierOrder";
import { sendSupplierPurchaseOrders } from "../b2b/exchange/supplierChannel";
import { enqueue, type Handler, type Tx } from "../messaging/outbox";
import { minorToDecimal } from "./money";
import { getStoredOrder } from "./store";
import { transition } from "./workflow";

function supplierOrderFor(tx: Tx, orderId: string): SupplierOrder {
  const stored = getStoredOrder(orderId, tx);
  if (!stored) throw new Error(`Approved order ${orderId} vanished from the store.`);
  return {
    orderId,
    orderDate: stored.orderDate,
    shippingInfo: {
      familyName: stored.contact.familyName,
      givenName: stored.contact.givenName,
      phone: stored.contact.telephone,
      email: stored.contact.email ?? "",
      address: stored.address,
    },
    lineItems: stored.lines.map((l) => ({
      categoryId: l.categoryId,
      productId: l.productId,
      itemId: l.itemId,
      lineNum: l.lineNum,
      quantity: l.quantity,
      unitPrice: minorToDecimal(l.unitPrice, stored.locale),
    })),
  };
}

/**
 * Applies each decision only to a PENDING order (conditional update); an
 * unknown or already-decided order is ignored. Sends one supplier purchase
 * order per approval and one customer notice listing the changed orders.
 * Returns the ids that changed.
 */
export function applyApprovalBatch(tx: Tx, entries: ApprovalEntry[]): string[] {
  const changed: ApprovalEntry[] = [];
  for (const entry of entries) {
    if (!transition(tx, entry.orderId, entry.status)) continue;
    changed.push(entry);
    if (entry.status === "APPROVED") {
      sendSupplierPurchaseOrders(tx, [supplierOrderFor(tx, entry.orderId)]);
    }
  }
  if (changed.length > 0) {
    enqueue(tx, "opc.approval-notice", writeOrderApproval(changed));
  }
  return changed.map((e) => e.orderId);
}

/** Consumer for `opc.order-approval`; a read error propagates so the dispatcher retries. */
export function createOrderApprovalHandler(): Handler {
  return async (payload) => {
    const entries = await readOrderApproval(payload);
    return (tx) => {
      applyApprovalBatch(tx, entries);
    };
  };
}
