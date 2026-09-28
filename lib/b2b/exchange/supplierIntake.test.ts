import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../db/client";
import {
  outboxDeliveries,
  outboxMessages,
  supplierAddresses,
  supplierContacts,
  supplierLineItems,
  supplierOrders,
} from "../../../db/schema";
import { dispatchPending } from "../../messaging/dispatcher";
import { enqueue, registerConsumer, type Tx } from "../../messaging/outbox";
import type { SupplierOrder } from "../documents/supplierOrder";
import { buildPartnerSupplierOrder } from "../partner/tpaSupplierOrder";
import type { PartnerInvoice } from "../partner/tpaInvoice";
import * as validateModule from "../xml/validate";
import { createSupplierIntakeHandler } from "./supplierIntake";

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

function orderFixture(orderId: string): SupplierOrder {
  return {
    orderId,
    orderDate: new Date(2002, 2, 15),
    shippingInfo: CONTACT,
    lineItems: [
      {
        categoryId: "cat",
        productId: "prod",
        itemId: "i1",
        lineNum: 1,
        quantity: 2,
        unitPrice: "19.99",
      },
    ],
  };
}

// A partner-format order the reader can read structurally (>=1 LineItem)
// but the XSD's xs:unique itemId constraint rejects — the schema-only
// violation R9 describes, unlike removing every LineItem (which the
// reader itself rejects regardless of the validation switch).
function schemaInvalidOrderXml(orderId: string): string {
  return buildPartnerSupplierOrder(
    {
      orderId,
      orderDate: new Date(2002, 2, 15),
      shippingInfo: CONTACT,
      lineItems: [
        {
          categoryId: "c",
          productId: "p",
          itemId: "dup",
          lineNum: 1,
          quantity: 2,
          unitPrice: "19.99",
        },
        {
          categoryId: "c",
          productId: "p",
          itemId: "dup",
          lineNum: 2,
          quantity: 1,
          unitPrice: "9.99",
        },
      ],
    },
    { form: "xsd" },
  );
}

async function dispatchOnce() {
  return dispatchPending();
}

beforeEach(() => {
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
  db.delete(supplierLineItems).run();
  db.delete(supplierContacts).run();
  db.delete(supplierAddresses).run();
  db.delete(supplierOrders).run();
});

afterEach(() => {
  delete process.env.B2B_VALIDATE_SUPPLIER_ORDER;
  delete process.env.B2B_VALIDATE_INVOICE;
  vi.restoreAllMocks();
});

describe("createSupplierIntakeHandler", () => {
  it("persists the order, its contact, address and line items with money converted to exact cents", async () => {
    registerConsumer("supplier.purchase-order", "supplier-intake", createSupplierIntakeHandler());
    const xml = buildPartnerSupplierOrder(orderFixture("ORD-PERSIST"), { form: "xsd" });
    db.transaction((tx) => enqueue(tx, "supplier.purchase-order", xml));

    const result = await dispatchOnce();

    expect(result).toEqual({ delivered: 1, failed: 0 });
    expect(
      db.select().from(supplierOrders).where(eq(supplierOrders.orderId, "ORD-PERSIST")).get(),
    ).toMatchObject({ status: "PENDING" });
    expect(
      db.select().from(supplierContacts).where(eq(supplierContacts.orderId, "ORD-PERSIST")).get(),
    ).toMatchObject({ familyName: "Doe", givenName: "Jane" });
    expect(
      db.select().from(supplierAddresses).where(eq(supplierAddresses.orderId, "ORD-PERSIST")).get(),
    ).toMatchObject({ streetName1: "1 Main St", city: "Springfield" });
    const items = db
      .select()
      .from(supplierLineItems)
      .where(eq(supplierLineItems.orderId, "ORD-PERSIST"))
      .all();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ unitPrice: 1999, quantityShipped: 0 });
  });

  it("ships nothing and publishes no invoice by default", async () => {
    registerConsumer("supplier.purchase-order", "supplier-intake", createSupplierIntakeHandler());
    const xml = buildPartnerSupplierOrder(orderFixture("ORD-NOSHIP"), { form: "xsd" });
    db.transaction((tx) => enqueue(tx, "supplier.purchase-order", xml));

    await dispatchOnce();

    expect(
      db.select().from(outboxMessages).where(eq(outboxMessages.channel, "opc.invoice")).all(),
    ).toHaveLength(0);
  });

  /** SWHR-R-0047.01 */
  it("[SWHR-C-0089] does not persist an invalid supplier order when validation is enabled", async () => {
    registerConsumer("supplier.purchase-order", "supplier-intake", createSupplierIntakeHandler());
    db.transaction((tx) =>
      enqueue(tx, "supplier.purchase-order", schemaInvalidOrderXml("ORD-INVALID")),
    );

    const result = await dispatchOnce();

    expect(result).toEqual({ delivered: 0, failed: 1 });
    expect(
      db.select().from(supplierOrders).where(eq(supplierOrders.orderId, "ORD-INVALID")).get(),
    ).toBeUndefined();
  });

  /** SWHR-R-0047.02 */
  it("[SWHR-C-0090] processes a supplier order without validation when disabled by deployment", async () => {
    process.env.B2B_VALIDATE_SUPPLIER_ORDER = "false";
    process.env.B2B_VALIDATE_INVOICE = "false";
    const spy = vi.spyOn(validateModule, "validateDocument");
    registerConsumer("supplier.purchase-order", "supplier-intake", createSupplierIntakeHandler());
    db.transaction((tx) =>
      enqueue(tx, "supplier.purchase-order", schemaInvalidOrderXml("ORD-DISABLED")),
    );

    const result = await dispatchOnce();

    expect(spy).not.toHaveBeenCalled();
    expect(result).toEqual({ delivered: 1, failed: 0 });
    expect(
      db.select().from(supplierOrders).where(eq(supplierOrders.orderId, "ORD-DISABLED")).get(),
    ).toMatchObject({ status: "PENDING" });
  });

  /** SWHR-R-0050.01 */
  it("[SWHR-C-0095] records no supplier order and redelivers the message when invoice publication fails", async () => {
    registerConsumer(
      "supplier.purchase-order",
      "supplier-intake",
      createSupplierIntakeHandler({
        shipOnReceipt: (): PartnerInvoice[] => {
          throw new Error("invoice channel unavailable");
        },
      }),
    );
    db.transaction((tx) =>
      enqueue(
        tx,
        "supplier.purchase-order",
        buildPartnerSupplierOrder(orderFixture("ORD-SHIP-FAILS"), { form: "xsd" }),
      ),
    );

    const result = await dispatchOnce();

    expect(result).toEqual({ delivered: 0, failed: 1 });
    expect(
      db.select().from(supplierOrders).where(eq(supplierOrders.orderId, "ORD-SHIP-FAILS")).get(),
    ).toBeUndefined();

    const delivery = db
      .select()
      .from(outboxDeliveries)
      .where(eq(outboxDeliveries.consumer, "supplier-intake"))
      .get()!;
    expect(delivery.status).toBe("pending");
    expect(delivery.attempts).toBe(1);
  });

  it("publishes shipOnReceipt's invoices atomically with the order (success path)", async () => {
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
    db.transaction((tx) =>
      enqueue(
        tx,
        "supplier.purchase-order",
        buildPartnerSupplierOrder(orderFixture("ORD-SHIPS"), { form: "xsd" }),
      ),
    );

    const result = await dispatchOnce();

    expect(result).toEqual({ delivered: 1, failed: 0 });
    expect(
      db.select().from(supplierOrders).where(eq(supplierOrders.orderId, "ORD-SHIPS")).get(),
    ).toMatchObject({ status: "PENDING" });
    const invoiceMessages = db
      .select()
      .from(outboxMessages)
      .where(eq(outboxMessages.channel, "opc.invoice"))
      .all();
    expect(invoiceMessages).toHaveLength(1);
    expect(invoiceMessages[0]!.payload).toContain("ORD-SHIPS");
  });

  /** SWHR-R-0050.02 */
  it("[SWHR-C-0096] records no supplier order for a malformed order message", async () => {
    registerConsumer("supplier.purchase-order", "supplier-intake", createSupplierIntakeHandler());
    const before = db.select().from(supplierOrders).all().length;
    db.transaction((tx) =>
      enqueue(tx, "supplier.purchase-order", "<SupplierOrder><OrderId>ORD-MALFORMED"),
    );

    const result = await dispatchOnce();

    expect(result).toEqual({ delivered: 0, failed: 1 });
    expect(db.select().from(supplierOrders).all()).toHaveLength(before);
  });
});
