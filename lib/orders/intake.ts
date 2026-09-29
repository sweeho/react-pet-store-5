import { readPurchaseOrder } from "../b2b/documents/purchaseOrder";
import type { Handler } from "../messaging/outbox";
import { persistPurchaseOrder } from "./store";

/**
 * Consumer for `opc.purchase-order`. Prepare parses the document and commit
 * stores it in the dispatcher's transaction. A read error propagates, so the
 * dispatcher retries or marks the delivery dead; nothing is dropped.
 * `persistPurchaseOrder` ignores a known orderId, so redelivery is a no-op.
 */
export function createOrderIntakeHandler(): Handler {
  return async (payload) => {
    const po = await readPurchaseOrder(payload);
    return (tx) => persistPurchaseOrder(tx, po);
  };
}
