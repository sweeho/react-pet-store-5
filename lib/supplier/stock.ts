/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs */
import type { PartnerInvoice } from "../b2b/partner/tpaInvoice";
import type { Tx } from "../messaging/outbox";

export function fulfilSupplierOrder(tx: Tx, orderId: string, now: Date): PartnerInvoice | null {
  throw new Error("VortexNotImplemented");
}

export function refulfilPendingSupplierOrders(tx: Tx, now: Date): PartnerInvoice[] {
  throw new Error("VortexNotImplemented");
}

export function applyStockUpdate(
  tx: Tx,
  updates: { itemId: string; quantity: number }[],
  now: Date,
): PartnerInvoice[] {
  throw new Error("VortexNotImplemented");
}
