import { writeOrderApproval } from "../b2b/documents/orderApproval";
import { readPurchaseOrder } from "../b2b/documents/purchaseOrder";
import { enqueue, type Handler } from "../messaging/outbox";
import { shouldAutoApprove } from "./approvalPolicy";
import { decimalToMinor } from "./money";
import { persistPurchaseOrder } from "./store";

/**
 * Consumer for `opc.purchase-order`. Prepare parses the document and commit
 * stores it in the dispatcher's transaction. A read error propagates, so the
 * dispatcher retries or marks the delivery dead; nothing is dropped.
 * `persistPurchaseOrder` ignores a known orderId, so redelivery is a no-op.
 * A newly stored order under its locale's threshold gets an APPROVED
 * decision on `opc.order-approval` in the same transaction (design.md P5).
 */
export function createOrderIntakeHandler(): Handler {
  return async (payload) => {
    const po = await readPurchaseOrder(payload);
    return (tx) => {
      const inserted = persistPurchaseOrder(tx, po);
      if (inserted && shouldAutoApprove(po.locale, decimalToMinor(po.totalPrice, po.locale))) {
        enqueue(
          tx,
          "opc.order-approval",
          writeOrderApproval([{ orderId: po.orderId, status: "APPROVED" }]),
        );
      }
    };
  };
}
