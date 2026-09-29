import { H3Event } from "nitro/h3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../db/client";
import {
  cartLines,
  counters,
  customers,
  groupMembers,
  outboxDeliveries,
  outboxMessages,
  purchaseOrders,
  sessions,
  users,
} from "../../../db/schema";
import type { AccountFormInput } from "../../../lib/account/form";
import { createCredential } from "../../../lib/auth/credentials";
import { updateAuthSession } from "../../../lib/auth/session";
import { addCartItem, countCartLines, updateCartQuantities } from "../../../lib/cart/lines";
import { readPurchaseOrder } from "../../../lib/b2b/documents/purchaseOrder";
import type { OrderContactInput } from "../../../lib/checkout/contact";
import { createCustomer } from "../../../lib/account/customer";
import * as outbox from "../../../lib/messaging/outbox";
import putAccount from "../account/index.put";
import postOrders from "./index.post";

vi.mock("../../../lib/messaging/outbox", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../lib/messaging/outbox")>();
  return { ...original, enqueue: vi.fn(original.enqueue) };
});

const account: AccountFormInput = {
  givenName: "ABC",
  familyName: "XYZ",
  telephone: "555-555-5555",
  email: "abc@xyz.com",
  streetName1: "1 Main",
  streetName2: "Apt 2",
  city: "Palo Alto",
  state: "California",
  zipCode: "94303",
  country: "United States",
  cardNumber: "4111-1111-1111-4242",
  cardType: "Duke Express",
  expiryMonth: "03",
  expiryYear: "2030",
  preferredLanguage: "en_US",
  favoriteCategory: "DOGS",
  myListPreference: true,
  bannerPreference: true,
};

const contact: OrderContactInput = {
  givenName: "ABC",
  familyName: "XYZ",
  streetName1: "1 Main",
  streetName2: "Apt 2",
  city: "Palo Alto",
  state: "California",
  zipCode: "94303",
  country: "United States",
  telephone: "555-555-5555",
  email: "bill@example.com",
};

function cookieFrom(event: H3Event): string {
  return event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
}

async function signIn(
  userId: string,
  accountEmail = account.email,
): Promise<{ cookie: string; sessionId: string }> {
  await createCredential(userId, "Secret1");
  createCustomer(userId);
  const event = new H3Event(new Request("http://localhost/"));
  const session = await updateAuthSession(event, "storefront", { userId, signedOn: true });
  const cookie = cookieFrom(event);
  await putAccount(
    new H3Event(
      new Request("http://localhost/api/account", {
        method: "PUT",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ ...account, email: accountEmail }),
      }),
    ),
  );
  return { cookie, sessionId: session.id };
}

function fillCart(sessionId: string): void {
  addCartItem(sessionId, "EST-1");
  addCartItem(sessionId, "EST-6");
  updateCartQuantities(sessionId, { "EST-1": 2 });
}

function post(cookie: string, body: unknown): H3Event {
  return new H3Event(
    new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(body),
    }),
  );
}

const validBody = { billing: contact, shipping: contact };

function queued() {
  return db.select().from(outboxMessages).all();
}

beforeEach(() => {
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
  db.delete(purchaseOrders).run();
  db.delete(counters).run();
  db.delete(cartLines).run();
  db.delete(customers).run();
  db.delete(sessions).run();
  db.delete(groupMembers).run();
  db.delete(users).run();
});

afterEach(() => {
  vi.useRealTimers();
  vi.mocked(outbox.enqueue).mockClear();
});

describe("POST /api/orders", () => {
  it("[SWHR-C-0258] answers before approval: one message queued, no approved order stored", async () => {
    const { cookie, sessionId } = await signIn("j2ee");
    fillCart(sessionId);
    const event = post(cookie, validBody);

    const result = await postOrders(event);

    expect(result).toMatchObject({ orderId: "10011", email: "bill@example.com" });
    expect(queued()).toHaveLength(1);
    expect(queued()[0].channel).toBe("opc.purchase-order");
    expect(
      db
        .select()
        .from(purchaseOrders)
        .all()
        .filter((o) => o.status === "APPROVED"),
    ).toEqual([]);
  });

  it("[SWHR-C-0260] keeps billing city and ships to San Jose", async () => {
    const { cookie, sessionId } = await signIn("j2ee");
    fillCart(sessionId);

    await postOrders(
      post(cookie, { billing: contact, shipping: { ...contact, city: "San Jose" } }),
    );

    const po = await readPurchaseOrder(queued()[0].payload);
    expect(po.billingInfo.address.city).toBe("Palo Alto");
    expect(po.shippingInfo.address.city).toBe("San Jose");
  });

  it("[SWHR-C-0262] blank shipping telephone places no order and reports the field", async () => {
    const { cookie, sessionId } = await signIn("j2ee");
    fillCart(sessionId);
    const event = post(cookie, { billing: contact, shipping: { ...contact, telephone: "" } });

    const result = await postOrders(event);

    expect(event.res.status).toBe(400);
    expect(result).toMatchObject({ missing: ["shipping.telephone"] });
    expect(queued()).toHaveLength(0);
  });

  it("[SWHR-C-0460] no billing e-mail and no account e-mail places no order and reports billing.email", async () => {
    const { cookie, sessionId } = await signIn("j2ee", "");
    fillCart(sessionId);
    const linesBefore = countCartLines(sessionId);
    const countersBefore = db.select().from(counters).all();
    const blank = { ...contact, email: "" };
    const event = post(cookie, { billing: blank, shipping: blank });

    const result = await postOrders(event);

    expect(event.res.status).toBe(400);
    expect(result).toMatchObject({ screen: "/error", missing: ["billing.email"] });
    expect(queued().filter((m) => m.channel === "opc.purchase-order")).toHaveLength(0);
    expect(db.select().from(counters).all()).toEqual(countersBefore);
    expect(countCartLines(sessionId)).toBe(linesBefore);
    expect(db.select().from(sessions).all()[0].lastOrderId).toBeNull();
  });

  it("a blank billing e-mail falls back to the account e-mail on the queued purchase order", async () => {
    const { cookie, sessionId } = await signIn("j2ee");
    fillCart(sessionId);
    const event = post(cookie, { billing: { ...contact, email: "" }, shipping: contact });

    const result = await postOrders(event);

    expect(result).toMatchObject({ email: "abc@xyz.com" });
    const po = await readPurchaseOrder(queued()[0].payload);
    expect(po.emailId).toBe("abc@xyz.com");
  });

  it("[SWHR-C-0264] empty cart answers the empty-cart Order Error and queues nothing", async () => {
    const { cookie } = await signIn("j2ee");
    const event = post(cookie, validBody);

    const result = await postOrders(event);

    expect(event.res.status).toBe(409);
    expect(result).toMatchObject({ kind: "EmptyCart", screen: "/order-error" });
    expect(queued()).toHaveLength(0);
  });

  it("[SWHR-C-0266] the purchase order carries id, user, e-mail, date, contacts, card and locale", async () => {
    const { cookie, sessionId } = await signIn("j2ee");
    fillCart(sessionId);
    vi.useFakeTimers({ toFake: ["Date"], now: new Date() });
    const frozen = new Date();

    await postOrders(post(cookie, validBody));

    const po = await readPurchaseOrder(queued()[0].payload);
    expect(po.orderId).toBe("10011");
    expect(po.userId).toBe("j2ee");
    expect(po.emailId).toBe("bill@example.com");
    expect(po.orderDate.toDateString()).toBe(frozen.toDateString());
    expect(po.billingInfo.givenName).toBe("ABC");
    expect(po.shippingInfo.address.streetName1).toBe("1 Main");
    expect(po.creditCard.cardType).toBe("Duke Express");
    expect(po.locale).toBe("en_US");
  });

  it("[SWHR-C-0267] two lines in cart order with total 51.50", async () => {
    const { cookie, sessionId } = await signIn("j2ee");
    fillCart(sessionId);

    await postOrders(post(cookie, validBody));

    const po = await readPurchaseOrder(queued()[0].payload);
    expect(po.lineItems).toMatchObject([
      { itemId: "EST-1", lineNum: 0, quantity: 2, unitPrice: "16.50" },
      { itemId: "EST-6", lineNum: 1, quantity: 1, unitPrice: "18.50" },
    ]);
    expect(po.totalPrice).toBe("51.50");
  });

  it("[SWHR-C-0268] the queued purchase order carries card number, type and expiry", async () => {
    const { cookie, sessionId } = await signIn("j2ee");
    fillCart(sessionId);

    await postOrders(post(cookie, validBody));

    const { creditCard } = await readPurchaseOrder(queued()[0].payload);
    expect(creditCard.cardNumber).toBe("•••• •••• •••• 4242");
    expect(creditCard.cardType).toBe("Duke Express");
    expect(creditCard.expiryDate).toBe("03/2030");
  });

  it("[SWHR-C-0269] publishes exactly one message and empties the cart", async () => {
    const { cookie, sessionId } = await signIn("j2ee");
    fillCart(sessionId);

    await postOrders(post(cookie, validBody));

    expect(queued()).toHaveLength(1);
    expect((await readPurchaseOrder(queued()[0].payload)).orderId).toBe("10011");
    expect(countCartLines(sessionId)).toBe(0);
  });

  it("[SWHR-C-0270] a rejected send raises an error and keeps the cart", async () => {
    const { cookie, sessionId } = await signIn("j2ee");
    fillCart(sessionId);
    vi.mocked(outbox.enqueue).mockImplementationOnce(() => {
      throw new Error("queue down");
    });
    const event = post(cookie, validBody);

    const result = await postOrders(event);

    expect(event.res.status).toBeGreaterThanOrEqual(400);
    expect(result).not.toHaveProperty("orderId");
    expect(countCartLines(sessionId)).toBe(2);
  });

  it("[SWHR-C-0283] an enqueue failure rolls back the id increment and the message", async () => {
    const { cookie, sessionId } = await signIn("j2ee");
    fillCart(sessionId);
    db.insert(counters).values({ name: "1001", value: 5 }).run();
    vi.mocked(outbox.enqueue).mockImplementationOnce(() => {
      throw new Error("queue down");
    });

    const result = await postOrders(post(cookie, validBody));

    expect(result).not.toHaveProperty("orderId");
    expect(db.select().from(counters).all()).toEqual([{ name: "1001", value: 5 }]);
    expect(queued()).toHaveLength(0);
    expect(countCartLines(sessionId)).toBe(2);
  });

  it("answers 401 when not signed on", async () => {
    await expect(postOrders(post("", validBody))).rejects.toMatchObject({ status: 401 });
  });
});
