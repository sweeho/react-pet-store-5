import { enqueue, type Tx } from "../../messaging/outbox";
import type { SupplierOrder } from "../documents/supplierOrder";
import { buildPartnerSupplierOrder } from "../partner/tpaSupplierOrder";

/**
 * SWHR-R-0049: each approved order's supplier purchase order is delivered
 * as one message per order, point-to-point to the supplier's inbox
 * (`supplier.purchase-order`, one subscriber: `supplier-intake`).
 */
export function sendSupplierPurchaseOrders(tx: Tx, orders: SupplierOrder[]): void {
  for (const order of orders) {
    enqueue(tx, "supplier.purchase-order", buildPartnerSupplierOrder(order));
  }
}
