import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../db/client";
import {
  outboxDeliveries,
  outboxMessages,
  supplierInventory,
  supplierLineItems,
  supplierOrders,
} from "../db/schema";
import { getSupplierOrder } from "../lib/b2b/exchange/supplierOrders";
import type { SupplierOrder } from "../lib/b2b/documents/supplierOrder";
import { buildPartnerSupplierOrder } from "../lib/b2b/partner/tpaSupplierOrder";
import { dispatchPending } from "../lib/messaging/dispatcher";
import { enqueue, getConsumer } from "../lib/messaging/outbox";
import plugin from "./supplier-intake";

const fakeNitroApp = {} as Parameters<typeof plugin>[0];

beforeEach(() => {
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
  db.delete(supplierInventory).run();
  db.delete(supplierOrders).run();
  plugin(fakeNitroApp);
});

function order(orderId: string, items: [string, number][]): SupplierOrder {
  return {
    orderId,
    orderDate: new Date(2026, 0, 2),
    shippingInfo: {
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
    },
    lineItems: items.map(([itemId, quantity], i) => ({
      categoryId: "FISH",
      productId: "FI-1",
      itemId,
      lineNum: i + 1,
      quantity,
      unitPrice: "20.50",
    })),
  };
}

const send = (o: SupplierOrder) =>
  db.transaction((tx) =>
    enqueue(tx, "supplier.purchase-order", buildPartnerSupplierOrder(o, { form: "xsd" })),
  );
const invoices = () =>
  db
    .select()
    .from(outboxMessages)
    .all()
    .filter((m) => m.channel === "opc.invoice");

describe("supplier-intake plugin", () => {
  it("registers the supplier-intake consumer on supplier.purchase-order", () => {
    expect(getConsumer("supplier.purchase-order", "supplier-intake")).toBeTypeOf("function");
  });

  it("[SWHR-C-0372] an unparseable supplier PO stores nothing and is not acknowledged", async () => {
    db.transaction((tx) => enqueue(tx, "supplier.purchase-order", "<SupplierOrder><OrderId>X"));

    const result = await dispatchPending();

    expect(result).toEqual({ delivered: 0, failed: 1 });
    expect(db.select().from(supplierOrders).all()).toHaveLength(0);
    const delivery = db
      .select()
      .from(outboxDeliveries)
      .where(eq(outboxDeliveries.consumer, "supplier-intake"))
      .get();
    expect(delivery?.status).not.toBe("delivered");
  });

  it("[SWHR-C-0374] supplier order 1001 is created PENDING with a contact and unshipped lines", async () => {
    send(
      order("1001", [
        ["EST-1", 2],
        ["EST-6", 1],
      ]),
    );

    await dispatchPending();

    const stored = getSupplierOrder("1001");
    expect(stored?.status).toBe("PENDING");
    expect(stored?.shippingInfo.familyName).toBe("Doe");
    expect(stored?.lineItems.map((l) => l.quantityShipped)).toEqual([0, 0]);
    expect(db.select().from(supplierLineItems).all()).toHaveLength(2);
  });

  it("[SWHR-C-0377] receiving 1001 with no stock stores it PENDING and sends no invoice", async () => {
    send(order("1001", [["EST-1", 2]]));

    await dispatchPending();

    expect(getSupplierOrder("1001")?.status).toBe("PENDING");
    expect(invoices()).toHaveLength(0);
  });

  it("[SWHR-C-0378] receiving 1002 with full stock completes it and sends one invoice", async () => {
    db.insert(supplierInventory)
      .values([
        { itemId: "EST-1", quantity: 10 },
        { itemId: "EST-6", quantity: 10 },
      ])
      .run();
    send(
      order("1002", [
        ["EST-1", 2],
        ["EST-6", 1],
      ]),
    );

    await dispatchPending();

    expect(getSupplierOrder("1002")?.status).toBe("COMPLETED");
    const sent = invoices();
    expect(sent).toHaveLength(1);
    expect(sent[0]!.payload).toContain("1002");
    expect(sent[0]!.payload).toContain("EST-1");
    expect(sent[0]!.payload).toContain("EST-6");
  });
});
