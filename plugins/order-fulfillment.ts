import { definePlugin } from "nitro";

import { resolveChannel } from "../lib/messaging/channels";
import { registerConsumer } from "../lib/messaging/outbox";
import { createOrderFulfillmentHandler } from "../lib/orders/invoice";

/** Registers the order-fulfillment consumer on the invoice channel at server start. */
export default definePlugin(() => {
  registerConsumer(
    resolveChannel("opc.invoice"),
    "order-fulfillment",
    createOrderFulfillmentHandler(),
  );
});
