import { definePlugin } from "nitro";

import { createSupplierIntakeHandler } from "../lib/b2b/exchange/supplierIntake";
import { runStep } from "../lib/messaging/errors";
import { registerConsumer } from "../lib/messaging/outbox";
import { fulfilSupplierOrder } from "../lib/supplier/stock";

/** Registers the supplier-intake consumer, shipping from stock on receipt, at server start. */
export default definePlugin(() => {
  registerConsumer(
    "supplier.purchase-order",
    "supplier-intake",
    createSupplierIntakeHandler({
      shipOnReceipt: (tx, order) => {
        const invoice = runStep("supplier-fulfilment", () =>
          fulfilSupplierOrder(tx, order.orderId, new Date()),
        );
        return invoice ? [invoice] : [];
      },
    }),
  );
});
