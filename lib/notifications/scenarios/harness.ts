import { db } from "../../../db/client";
import {
  orderWorkflow,
  outboxDeliveries,
  outboxMessages,
  purchaseOrders,
  supplierInventory,
  supplierOrders,
} from "../../../db/schema";
import { createSupplierIntakeHandler } from "../../b2b/exchange/supplierIntake";
import { dispatchPending } from "../../messaging/dispatcher";
import { registerConsumer } from "../../messaging/outbox";
import { createOrderApprovalHandler } from "../../orders/approval";
import { createOrderIntakeHandler } from "../../orders/intake";
import { createOrderFulfillmentHandler } from "../../orders/invoice";
import { fulfilSupplierOrder } from "../../supplier/stock";
import { createMailerHandler } from "../mailer";
import {
  createApprovalNoticeHandler,
  createCompletedNoticeHandler,
  createShipmentNoticeHandler,
} from "../producers";
import type { MailTransport } from "../transport";

const ALL_ON = { approval: true, shipment: true, completed: true };

/**
 * Clears the database and registers every real consumer, with the mailer
 * on the given transport. `from` and `now` are fixed so tests stay exact.
 */
export function setUpScenario(
  transport: MailTransport,
  log: (message: string, error: unknown) => void,
): void {
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
  db.delete(orderWorkflow).run();
  db.delete(purchaseOrders).run();
  db.delete(supplierOrders).run();
  db.delete(supplierInventory).run();
  registerConsumer("opc.purchase-order", "order-intake", createOrderIntakeHandler());
  registerConsumer("opc.order-approval", "order-approval", createOrderApprovalHandler());
  registerConsumer("opc.invoice", "order-fulfillment", createOrderFulfillmentHandler());
  registerConsumer(
    "supplier.purchase-order",
    "supplier-intake",
    createSupplierIntakeHandler({
      shipOnReceipt: (tx, order) => {
        const invoice = fulfilSupplierOrder(tx, order.orderId, new Date());
        return invoice ? [invoice] : [];
      },
    }),
  );
  registerConsumer(
    "opc.approval-notice",
    "customer-notification",
    createApprovalNoticeHandler(ALL_ON),
  );
  registerConsumer("opc.invoice", "customer-notification", createShipmentNoticeHandler(ALL_ON));
  registerConsumer(
    "opc.completed-order",
    "customer-notification",
    createCompletedNoticeHandler(ALL_ON),
  );
  registerConsumer(
    "mail.request",
    "mailer",
    createMailerHandler({ transport, from: "customerservice@javapetstoredemo.com", log }),
  );
}

/** One round of the general poller, exactly as plugins/outbox-dispatcher.ts runs it. */
export const runGeneralPass = () => dispatchPending({ except: ["mail.request"] });

/** One round of the mail poller, exactly as plugins/mail-sender.ts runs it. */
export const runMailPass = () => dispatchPending({ only: ["mail.request"] });

/** Runs both pollers until neither has anything left to deliver. */
export async function settleAll(): Promise<void> {
  for (let i = 0; i < 30; i++) {
    const general = await runGeneralPass();
    const mail = await runMailPass();
    if (general.delivered + general.failed + mail.delivered + mail.failed === 0) return;
  }
  throw new Error("outbox did not settle");
}
