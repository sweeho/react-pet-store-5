import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { orderWorkflow, outboxDeliveries, outboxMessages, purchaseOrders } from "../../db/schema";
import { writeOrderApproval } from "../b2b/documents/orderApproval";
import { type PurchaseOrder } from "../b2b/documents/purchaseOrder";
import { buildPartnerInvoice } from "../b2b/partner/tpaInvoice";
import { dispatchPending } from "../messaging/dispatcher";
import { enqueue, registerConsumer } from "../messaging/outbox";
import { createOrderFulfillmentHandler } from "../orders/invoice";
import { getStoredOrder, persistPurchaseOrder } from "../orders/store";
import { getStatus, transition } from "../orders/workflow";
import type { NotificationSwitches } from "./config";
import { createMailerHandler } from "./mailer";
import {
  createApprovalNoticeHandler,
  createCompletedNoticeHandler,
  createShipmentNoticeHandler,
} from "./producers";
import type { OutgoingEmail } from "./transport";

/**
 * INTEGRATION TEST
 *
 * The real customer-notification consumers and the mailer, driven through
 * the in-memory outbox with a capturing transport (no SMTP server).
 */
const ON: NotificationSwitches = { approval: true, shipment: true, completed: true };
const ADDRESS = {
  streetName1: "1 Main",
  streetName2: null,
  city: "Palo Alto",
  state: "California",
  zipCode: "94303",
  country: "United States",
};
const CONTACT = {
  familyName: "Lee",
  givenName: "Ann",
  email: "ann@example.com",
  phone: "555-555-5555",
  address: ADDRESS,
};

const ITEMS: [string, string, string, string][] = [
  ["FISH", "FI-SW-01", "EST-1", "16.50"],
  ["FISH", "FI-SW-02", "EST-2", "18.50"],
  ["DOGS", "K9-BD-01", "EST-3", "18.50"],
];

function order(orderId: string, emailId: string, locale = "en_US"): PurchaseOrder {
  const yen = locale === "ja_JP";
  return {
    locale,
    orderId,
    userId: "j2ee",
    emailId,
    orderDate: new Date("2026-01-02T03:04:05Z"),
    shippingInfo: CONTACT,
    billingInfo: CONTACT,
    totalPrice: yen ? "5000" : "53.50",
    creditCard: { cardNumber: "•••• 4242", cardType: "Visa", expiryDate: "12/2030" },
    lineItems: ITEMS.map(([categoryId, productId, itemId, price], i) => ({
      categoryId,
      productId,
      itemId,
      lineNum: i + 1,
      quantity: 1,
      unitPrice: yen ? String(Math.round(Number(price) * 100)) : price,
    })),
  };
}

function store(orderId: string, emailId: string, locale?: string): void {
  db.transaction((tx) => {
    persistPurchaseOrder(tx, order(orderId, emailId, locale));
    transition(tx, orderId, "APPROVED");
  });
}

const invoice = (orderId: string, itemIds: string[]) =>
  buildPartnerInvoice({
    orderId,
    userId: "j2ee",
    orderDate: new Date("2026-01-02T03:04:05Z"),
    shippingDate: new Date("2026-01-03T00:00:00Z"),
    lineItems: itemIds.map((itemId) => {
      const line = getStoredOrder(orderId)!.lines.find((l) => l.itemId === itemId)!;
      return {
        categoryId: line.categoryId,
        productId: line.productId,
        itemId,
        lineNum: line.lineNum,
        quantity: 1,
        unitPrice: "1.00",
      };
    }),
  });

let sent: OutgoingEmail[];

function register(switches: NotificationSwitches): void {
  registerConsumer(
    "opc.approval-notice",
    "customer-notification",
    createApprovalNoticeHandler(switches),
  );
  registerConsumer("opc.invoice", "customer-notification", createShipmentNoticeHandler(switches));
  registerConsumer(
    "opc.completed-order",
    "customer-notification",
    createCompletedNoticeHandler(switches),
  );
  registerConsumer("opc.invoice", "order-fulfillment", createOrderFulfillmentHandler());
  registerConsumer(
    "mail.request",
    "mailer",
    createMailerHandler({
      transport: { send: async (email) => void sent.push(email) },
      from: "customerservice@javapetstoredemo.com",
      log: () => {},
    }),
  );
}

async function settle(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    const round = await dispatchPending();
    if (round.delivered + round.failed === 0) return;
  }
  throw new Error("outbox did not settle");
}

const mailRequests = () =>
  db
    .select()
    .from(outboxMessages)
    .all()
    .filter((m) => m.channel === "mail.request");

beforeEach(() => {
  sent = [];
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
  db.delete(orderWorkflow).run();
  db.delete(purchaseOrders).run();
  register(ON);
});

describe("approval notice", () => {
  it("[SWHR-C-0001] approving an order sends one approval e-mail to the order's address", async () => {
    store("1001", "ann@example.com");
    db.transaction((tx) =>
      enqueue(
        tx,
        "opc.approval-notice",
        writeOrderApproval([{ orderId: "1001", status: "APPROVED" }]),
      ),
    );
    await settle();

    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe("ann@example.com");
    expect(sent[0]!.subject).toBe("Java Pet Store Order Status: 1001");
    expect(sent[0]!.html).toMatch(/approved/i);
  });

  it("[SWHR-C-0413] a batch approving 1001 and denying 1002 sends one e-mail per order", async () => {
    store("1001", "ann@example.com");
    store("1002", "bob@example.com");
    db.transaction((tx) =>
      enqueue(
        tx,
        "opc.approval-notice",
        writeOrderApproval([
          { orderId: "1001", status: "APPROVED" },
          { orderId: "1002", status: "DENIED" },
        ]),
      ),
    );
    await settle();

    expect(sent).toHaveLength(2);
    const first = sent.find((e) => e.subject.endsWith("1001"))!;
    const second = sent.find((e) => e.subject.endsWith("1002"))!;
    expect(first.to).toBe("ann@example.com");
    expect(first.html).toMatch(/approved/i);
    expect(second.to).toBe("bob@example.com");
    expect(second.html).toMatch(/denied/i);
    expect(second.html).not.toMatch(/approved/i);
  });
});

describe("shipment notice", () => {
  it("[SWHR-C-0414] an invoice for two of three lines sends one shipped e-mail listing those two", async () => {
    store("1001", "ann@example.com");
    db.transaction((tx) => enqueue(tx, "opc.invoice", invoice("1001", ["EST-1", "EST-2"])));
    await settle();

    const shipped = sent.filter((e) => e.subject.startsWith("Java Pet Store Order Shipped"));
    expect(shipped).toHaveLength(1);
    expect(shipped[0]!.subject).toBe("Java Pet Store Order Shipped: 1001");
    expect(shipped[0]!.to).toBe("ann@example.com");
    expect(shipped[0]!.html).toContain("FI-SW-01");
    expect(shipped[0]!.html).toContain("FI-SW-02");
    expect(shipped[0]!.html).not.toContain("K9-BD-01");
    expect(sent.some((e) => e.subject.includes("COMPLETED"))).toBe(false);
  });

  it("[SWHR-C-0415] the invoice that completes the order sends a shipment e-mail and a separate completed e-mail", async () => {
    store("1001", "ann@example.com");
    db.transaction((tx) =>
      enqueue(tx, "opc.invoice", invoice("1001", ["EST-1", "EST-2", "EST-3"])),
    );
    await settle();

    expect(getStatus(db, "1001")).toBe("COMPLETED");
    expect(sent.map((e) => e.subject).sort()).toEqual([
      "Java Pet Store Order COMPLETED: 1001",
      "Java Pet Store Order Shipped: 1001",
    ]);
  });

  it("[SWHR-C-0427] the shipment e-mail for a ja_JP order uses the Japanese wording", async () => {
    store("1003", "kei@example.com", "ja_JP");
    db.transaction((tx) => enqueue(tx, "opc.invoice", invoice("1003", ["EST-1"])));
    await settle();

    expect(sent).toHaveLength(1);
    expect(sent[0]!.html).toContain("発送");
    expect(sent[0]!.html).not.toContain("has shipped");
  });

  it("an invoice naming no order line sends nothing", async () => {
    store("1001", "ann@example.com");
    db.transaction((tx) =>
      enqueue(tx, "opc.invoice", invoice("1001", ["EST-1"]).replaceAll("EST-1", "NOPE")),
    );
    await settle();

    expect(sent).toHaveLength(0);
    expect(mailRequests()).toHaveLength(0);
  });

  it("an unknown order leaves its delivery pending for retry", async () => {
    db.transaction((tx) => enqueue(tx, "opc.completed-order", "9999"));
    const round = await dispatchPending();

    expect(round.failed).toBe(1);
    expect(sent).toHaveLength(0);
    const delivery = db.select().from(outboxDeliveries).all()[0]!;
    expect(delivery.status).toBe("pending");
    expect(delivery.attempts).toBe(1);
  });
});

describe("completed notice", () => {
  it("[SWHR-C-0416] completion sends a COMPLETED e-mail listing all three lines", async () => {
    store("1001", "ann@example.com");
    db.transaction((tx) => enqueue(tx, "opc.completed-order", "1001"));
    await settle();

    expect(sent).toHaveLength(1);
    expect(sent[0]!.subject).toBe("Java Pet Store Order COMPLETED: 1001");
    expect(sent[0]!.to).toBe("ann@example.com");
    for (const [, productId] of ITEMS) expect(sent[0]!.html).toContain(productId);
  });
});

describe("switches", () => {
  it("[SWHR-C-0418] shipment off: invoice applied, no shipment e-mail, other kinds still sent", async () => {
    register({ approval: true, shipment: false, completed: true });
    store("1001", "ann@example.com");
    db.transaction((tx) =>
      enqueue(tx, "opc.invoice", invoice("1001", ["EST-1", "EST-2", "EST-3"])),
    );
    db.transaction((tx) =>
      enqueue(
        tx,
        "opc.approval-notice",
        writeOrderApproval([{ orderId: "1001", status: "APPROVED" }]),
      ),
    );
    await settle();

    expect(getStatus(db, "1001")).toBe("COMPLETED");
    expect(getStoredOrder("1001")!.lines.map((l) => l.quantityShipped)).toEqual([1, 1, 1]);
    expect(sent.map((e) => e.subject).sort()).toEqual([
      "Java Pet Store Order COMPLETED: 1001",
      "Java Pet Store Order Status: 1001",
    ]);
    const deliveries = db.select().from(outboxDeliveries).all();
    expect(deliveries.every((d) => d.status === "delivered")).toBe(true);
  });
});
