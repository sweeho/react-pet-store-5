import { definePlugin } from "nitro";

import { createOrderApprovalHandler } from "../lib/orders/approval";
import { registerConsumer } from "../lib/messaging/outbox";

/** Registers the order-approval consumer at server start (design.md P4). */
export default definePlugin(() => {
  registerConsumer("opc.order-approval", "order-approval", createOrderApprovalHandler());
});
