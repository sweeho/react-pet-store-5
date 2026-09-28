import { eq, inArray } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { outboxDeliveries, outboxMessages, supplierOrders } from "../../../db/schema";
import { dispatchPending } from "../../messaging/dispatcher";
import { registerConsumer, type Tx } from "../../messaging/outbox";
import type { SupplierOrder } from "../documents/supplierOrder";
import { sendSupplierPurchaseOrders } from "../exchange/supplierChannel";
import { createSupplierIntakeHandler } from "../exchange/supplierIntake";
import { readPartnerInvoice } from "../partner/invoiceIntake";
import type { PartnerInvoice } from "../partner/tpaInvoice";

const CONTACT = {
  familyName: "Doe",
  givenName: "Jane",
  address: {
    streetName1: "1 Main St",
    streetName2: null,
    city: "Springfield",
    state: "IL",
    zipCode: "62701",
    country: "USA",
  },
  email: "jane@example.com",
  phone: "555-1234",
};

function orderFixture(orderId: string, itemId: string, quantity: number): SupplierOrder {
  return {
    orderId,
    orderDate: new Date(2002, 2, 15),
    shippingInfo: CONTACT,
    lineItems: [
      {
        categoryId: "cat",
        productId: "prod",
        itemId,
        lineNum: 1,
        quantity,
        unitPrice: "19.99",
      },
    ],
  };
}

async function drainOutbox(): Promise<{ delivered: number; failed: number }> {
  let total = { delivered: 0, failed: 0 };
  for (;;) {
    const round = await dispatchPending();
    total = { delivered: total.delivered + round.delivered, failed: total.failed + round.failed };
    if (round.delivered + round.failed === 0) {
      return total;
    }
  }
}

beforeEach(() => {
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
  db.delete(supplierOrders).run();
});

describe("order-to-invoice flow (approved order -> supplier intake -> invoice intake)", () => {
  it("delivers two orders through supplier intake and both invoice consumers with matching order ids and quantities", async () => {
    const fulfilmentInvoices: { orderId: string; shipped: Record<string, number> }[] = [];
    const notificationInvoices: { orderId: string; shipped: Record<string, number> }[] = [];

    registerConsumer("opc.invoice", "order-fulfillment", async (payload) => {
      const invoice = await readPartnerInvoice(payload, { log: () => {} });
      return () => {
        fulfilmentInvoices.push(invoice);
      };
    });
    registerConsumer("opc.invoice", "customer-notification", async (payload) => {
      const invoice = await readPartnerInvoice(payload, { log: () => {} });
      return () => {
        notificationInvoices.push(invoice);
      };
    });
    registerConsumer(
      "supplier.purchase-order",
      "supplier-intake",
      createSupplierIntakeHandler({
        shipOnReceipt: (_tx: Tx, order: SupplierOrder): PartnerInvoice[] => [
          {
            orderId: order.orderId,
            userId: "j2ee",
            orderDate: order.orderDate,
            shippingDate: order.orderDate,
            lineItems: order.lineItems,
          },
        ],
      }),
    );

    const orderA = orderFixture("ORD-FLOW-A", "item-a", 5);
    const orderB = orderFixture("ORD-FLOW-B", "item-b", 2);
    db.transaction((tx) => sendSupplierPurchaseOrders(tx, [orderA, orderB]));

    const totals = await drainOutbox();

    expect(totals.failed).toBe(0);

    const recordedOrders = db
      .select()
      .from(supplierOrders)
      .where(inArray(supplierOrders.orderId, ["ORD-FLOW-A", "ORD-FLOW-B"]))
      .all();
    expect(recordedOrders).toHaveLength(2);

    const deliveredInvoiceDeliveries = db
      .select()
      .from(outboxDeliveries)
      .where(inArray(outboxDeliveries.consumer, ["order-fulfillment", "customer-notification"]))
      .all()
      .filter((d) => d.status === "delivered");
    expect(deliveredInvoiceDeliveries).toHaveLength(4);

    expect(fulfilmentInvoices).toHaveLength(2);
    expect(notificationInvoices).toHaveLength(2);

    for (const [orderId, itemId, quantity] of [
      ["ORD-FLOW-A", "item-a", 5],
      ["ORD-FLOW-B", "item-b", 2],
    ] as const) {
      const inFulfilment = fulfilmentInvoices.find((i) => i.orderId === orderId);
      const inNotification = notificationInvoices.find((i) => i.orderId === orderId);
      expect(inFulfilment).toEqual({ orderId, shipped: { [itemId]: quantity } });
      expect(inNotification).toEqual({ orderId, shipped: { [itemId]: quantity } });
    }

    expect(
      db.select().from(outboxMessages).where(eq(outboxMessages.channel, "opc.invoice")).all(),
    ).toHaveLength(2);
  });
});
