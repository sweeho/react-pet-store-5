import { definePlugin } from "nitro";

import { createOrderIntakeHandler } from "../lib/orders/intake";
import { registerConsumer } from "../lib/messaging/outbox";

/** Registers the order-intake consumer at server start (design.md P3, P7). */
export default definePlugin(() => {
  registerConsumer("opc.purchase-order", "order-intake", createOrderIntakeHandler());
});
