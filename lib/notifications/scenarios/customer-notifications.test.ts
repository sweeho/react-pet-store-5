import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { outboxDeliveries } from "../../../db/schema";
import { type PurchaseOrder, writePurchaseOrder } from "../../b2b/documents/purchaseOrder";
import { enqueue } from "../../messaging/outbox";
import { getStatus } from "../../orders/workflow";
import { applyStockUpdate } from "../../supplier/stock";
import type { MailTransport, OutgoingEmail } from "../transport";
import { runGeneralPass, runMailPass, setUpScenario, settleAll } from "./harness";

/**
 * INTEGRATION TEST
 *
 * Customer notifications end to end through the real outbox, producers and
 * mailer, with a controllable MailTransport in place of SMTP.
 */
const contact = {
  familyName: "XYZ",
  givenName: "ABC",
  email: "ann@example.com",
  phone: "555-555-5555",
  address: {
    streetName1: "1 Main",
    streetName2: null,
    city: "Palo Alto",
    state: "California",
    zipCode: "94303",
    country: "United States",
  },
};

function purchaseOrder(orderId: string, lines: [string, number][]): PurchaseOrder {
  return {
    locale: "en_US",
    orderId,
    userId: "j2ee",
    emailId: "ann@example.com",
    orderDate: new Date("2026-01-02T03:04:05Z"),
    shippingInfo: contact,
    billingInfo: contact,
    totalPrice: "40.00",
    creditCard: { cardNumber: "•••• •••• •••• 4242", cardType: "Visa", expiryDate: "12/2030" },
    lineItems: lines.map(([itemId, quantity], i) => ({
      categoryId: "FISH",
      productId: "FI-SW-01",
      itemId,
      lineNum: i + 1,
      quantity,
      unitPrice: "20.00",
    })),
  };
}

const place = (po: PurchaseOrder) =>
  db.transaction((tx) => enqueue(tx, "opc.purchase-order", writePurchaseOrder(po)));

let sent: OutgoingEmail[];
let logged: Array<[string, unknown]>;
const log = (message: string, error: unknown) => logged.push([message, error]);

const capturing: MailTransport = {
  async send(email) {
    sent.push(email);
  },
};

beforeEach(() => {
  sent = [];
  logged = [];
});

describe("customer notification scenarios", () => {
  it("[SWHR-C-0417] an order approved and fulfilled in two shipments yields four emails", async () => {
    setUpScenario(capturing, log);
    place(
      purchaseOrder("N-1", [
        ["EST-1", 1],
        ["EST-6", 1],
      ]),
    );
    await settleAll();
    expect(getStatus(db, "N-1")).toBe("APPROVED");

    db.transaction((tx) => applyStockUpdate(tx, [{ itemId: "EST-1", quantity: 5 }], new Date()));
    await settleAll();
    db.transaction((tx) => applyStockUpdate(tx, [{ itemId: "EST-6", quantity: 5 }], new Date()));
    await settleAll();

    expect(getStatus(db, "N-1")).toBe("COMPLETED");
    expect(sent.map((e) => e.subject)).toEqual([
      "Java Pet Store Order Status: N-1",
      "Java Pet Store Order Shipped: N-1",
      "Java Pet Store Order Shipped: N-1",
      "Java Pet Store Order COMPLETED: N-1",
    ]);
    expect(new Set(sent.map((e) => e.to))).toEqual(new Set(["ann@example.com"]));
  });

  it("[SWHR-C-0420] the approval is recorded without waiting for a slow mail server, and mailed later", async () => {
    let release: () => void = () => {};
    let started = false;
    setUpScenario(
      {
        async send(email) {
          started = true;
          await new Promise<void>((resolve) => (release = resolve));
          sent.push(email);
        },
      },
      log,
    );
    place(purchaseOrder("S-1", [["EST-1", 1]]));

    // The general pass never touches mail, so it finishes with the send not yet started.
    for (let round = await runGeneralPass(); round.delivered + round.failed > 0; ) {
      round = await runGeneralPass();
    }
    expect(getStatus(db, "S-1")).toBe("APPROVED");
    expect(started).toBe(false);
    expect(sent).toHaveLength(0);

    let mailDone = false;
    const mailPass = runMailPass().then(() => {
      mailDone = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(started).toBe(true);
    expect(mailDone).toBe(false);
    expect(getStatus(db, "S-1")).toBe("APPROVED");

    release();
    await mailPass;
    expect(sent.map((e) => e.subject)).toEqual(["Java Pet Store Order Status: S-1"]);
  });

  it("[SWHR-C-0426] an unreachable mail server is logged, not retried, and the approval is kept", async () => {
    let attempts = 0;
    setUpScenario(
      {
        async send() {
          attempts++;
          throw new Error("connect ECONNREFUSED");
        },
      },
      log,
    );
    place(purchaseOrder("D-1", [["EST-1", 1]]));

    await settleAll();
    await settleAll();

    expect(attempts).toBe(1);
    expect(logged).toHaveLength(1);
    expect((logged[0]![1] as Error).message).toContain("ECONNREFUSED");
    const mailDeliveries = db
      .select()
      .from(outboxDeliveries)
      .where(eq(outboxDeliveries.consumer, "mailer"))
      .all();
    expect(mailDeliveries).toHaveLength(1);
    expect(mailDeliveries[0]!.status).toBe("delivered");
    expect(getStatus(db, "D-1")).toBe("APPROVED");
  });
});
