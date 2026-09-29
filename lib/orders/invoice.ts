/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs */
import type { Handler, Tx } from "../messaging/outbox";

export function applyInvoice(
  tx: Tx,
  orderId: string,
  shipped: Record<string, number>,
): "COMPLETED" | "SHIPPED_PART" {
  throw new Error("VortexNotImplemented");
}

export function createOrderFulfillmentHandler(): Handler {
  throw new Error("VortexNotImplemented");
}
