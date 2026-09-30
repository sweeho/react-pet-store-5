import { definePlugin } from "nitro";

import { registerConsumer } from "../lib/messaging/outbox";
import { loadNotificationSwitches } from "../lib/notifications/config";
import {
  createApprovalNoticeHandler,
  createCompletedNoticeHandler,
  createShipmentNoticeHandler,
} from "../lib/notifications/producers";

const CONSUMER = "customer-notification";

/**
 * Validates the notification switches at server start (a bad file stops the
 * server) and registers the customer-notification consumers.
 */
export default definePlugin(() => {
  const switches = loadNotificationSwitches();
  registerConsumer("opc.approval-notice", CONSUMER, createApprovalNoticeHandler(switches));
  registerConsumer("opc.invoice", CONSUMER, createShipmentNoticeHandler(switches));
  registerConsumer("opc.completed-order", CONSUMER, createCompletedNoticeHandler(switches));
});
