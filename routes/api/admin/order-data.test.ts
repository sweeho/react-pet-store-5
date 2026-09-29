import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import {
  category,
  categoryDetails,
  outboxDeliveries,
  outboxMessages,
  purchaseOrders,
  orderContacts,
  sessions,
} from "../../../db/schema";
import type { PurchaseOrder } from "../../../lib/b2b/documents/purchaseOrder";
import { updateAuthSession } from "../../../lib/auth/session";
import { persistPurchaseOrder } from "../../../lib/orders/store";
import orderData from "./order-data.post";

const SESSION_TIMED_OUT_ERROR =
  "Session Timed Out; Please exit and login as admin from the login page";

beforeEach(() => {
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
  db.delete(purchaseOrders).run();
  db.delete(sessions).run();
  db.delete(categoryDetails).where(eq(categoryDetails.locale, "en_US")).run();
  for (const [id, name] of [
    ["FISH", "Fish"],
    ["DOGS", "Dogs"],
  ] as const) {
    db.insert(category).values({ id }).onConflictDoNothing().run();
    db.insert(categoryDetails).values({ categoryId: id, locale: "en_US", name }).run();
  }
});

type Line = { categoryId: string; itemId: string; quantity: number; unitPrice: string };

function seed(
  orderId: string,
  opts: {
    status?: string;
    date?: Date;
    total?: string;
    locale?: string;
    lines?: Line[];
  } = {},
): void {
  const contact = {
    familyName: "XYZ",
    givenName: "ABC",
    email: "abc@example.com",
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
  const lines = opts.lines ?? [
    { categoryId: "FISH", itemId: "EST-1", quantity: 1, unitPrice: "20.00" },
  ];
  const po: PurchaseOrder = {
    locale: opts.locale ?? "en_US",
    orderId,
    userId: "j2ee",
    emailId: "abc@example.com",
    orderDate: opts.date ?? new Date("2002-02-03T10:00:00Z"),
    shippingInfo: contact,
    billingInfo: contact,
    totalPrice: opts.total ?? "20.00",
    creditCard: { cardNumber: "•••• •••• •••• 4242", cardType: "Visa", expiryDate: "12/2030" },
    lineItems: lines.map((l, i) => ({ ...l, productId: "P-1", lineNum: i + 1 })),
  };
  db.transaction((tx) => persistPurchaseOrder(tx, po));
  if (opts.status) {
    db.update(purchaseOrders)
      .set({ status: opts.status })
      .where(eq(purchaseOrders.orderId, orderId))
      .run();
  }
}

async function signOn(): Promise<string> {
  const event = new H3Event(new Request("http://localhost/"));
  await updateAuthSession(event, "admin", { userId: "jps_admin", signedOn: true });
  return event.res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

interface Result {
  error?: string;
  orders: { orderId: string }[];
  total: number | string;
  queued: number;
  groups: { name: string; value: string }[];
}

async function call(
  body: unknown,
  cookie?: string,
): Promise<{ status: number | undefined; result: Result }> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (cookie) headers.cookie = cookie;
  const event = new H3Event(
    new Request("http://localhost/api/admin/order-data", {
      method: "POST",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
  const result = (await orderData(event)) as Result;
  return { status: event.res.status ?? 200, result };
}

describe("POST /api/admin/order-data", () => {
  it("returns 401 with the timeout text and no data without a session", async () => {
    seed("1001");
    const { status, result } = await call({ type: "GETORDERS", status: "PENDING" });
    expect(status).toBe(401);
    expect(result).toEqual({ error: SESSION_TIMED_OUT_ERROR });
  });

  describe("GETORDERS", () => {
    it("[SWHR-C-0292] summarises the j2ee order of 2002-02-03 for 612.50", async () => {
      seed("1001", { total: "612.50", date: new Date("2002-02-03T10:00:00Z") });
      const { status, result } = await call(
        { type: "GETORDERS", status: "PENDING" },
        await signOn(),
      );
      expect(status).toBe(200);
      expect(result.orders).toEqual([
        { orderId: "1001", userId: "j2ee", date: "2/3/2002", amount: "612.50", status: "PENDING" },
      ]);
    });

    it("[SWHR-C-0294] returns exactly the 3 pending orders once each", async () => {
      seed("1001");
      seed("1002");
      seed("1003");
      seed("1004", { status: "APPROVED" });
      seed("1005", { status: "APPROVED" });
      const { result } = await call({ type: "GETORDERS", status: "PENDING" }, await signOn());
      expect(result.orders.map((o) => o.orderId)).toEqual(["1001", "1002", "1003"]);
      expect(result.total).toBe(3);
    });

    it("[SWHR-C-0295] returns an empty list and count 0 for DENIED with none", async () => {
      seed("1001");
      const { status, result } = await call(
        { type: "GETORDERS", status: "DENIED" },
        await signOn(),
      );
      expect(status).toBe(200);
      expect(result).toEqual({ orders: [], total: 0 });
    });

    it("[SWHR-C-0296] fails naming PENDING when an order's details are missing", async () => {
      seed("1001");
      db.delete(orderContacts).where(eq(orderContacts.orderId, "1001")).run();
      const { status, result } = await call(
        { type: "GETORDERS", status: "PENDING" },
        await signOn(),
      );
      expect(status).toBe(500);
      expect(result.error).toBe("Could not find PENDING orders");
    });
  });

  describe("UPDATESTATUS", () => {
    function queued(): string[] {
      return db
        .select()
        .from(outboxMessages)
        .where(eq(outboxMessages.channel, "opc.order-approval"))
        .all()
        .map((m) => m.payload);
    }

    it("[SWHR-C-0301] queues one approval document and leaves statuses unchanged", async () => {
      seed("1001");
      seed("1002");
      const { status, result } = await call(
        {
          type: "UPDATESTATUS",
          orders: [
            { orderId: "1001", status: "APPROVED" },
            { orderId: "1002", status: "DENIED" },
          ],
        },
        await signOn(),
      );
      expect(status).toBe(200);
      expect(result).toEqual({ result: "SUCCESS", queued: 2 });
      const docs = queued();
      expect(docs).toHaveLength(1);
      expect(docs[0]).toContain("1001");
      expect(docs[0]).toContain("1002");
      const rows = db.select().from(purchaseOrders).all();
      expect(rows.map((r) => r.status)).toEqual(["PENDING", "PENDING"]);
    });

    it("[SWHR-C-0302] drops an entry without an order id", async () => {
      seed("1002");
      const { result } = await call(
        {
          type: "UPDATESTATUS",
          orders: [{ status: "APPROVED" }, { orderId: "1002", status: "DENIED" }],
        },
        await signOn(),
      );
      expect(result.queued).toBe(1);
      const docs = queued();
      expect(docs).toHaveLength(1);
      expect(docs[0]).toContain("1002");
      expect(docs[0].match(/<Order>/g)).toHaveLength(1);
    });

    it("queues nothing when no entry is valid", async () => {
      const { status, result } = await call(
        { type: "UPDATESTATUS", orders: [{ orderId: "1001", status: "PENDING" }] },
        await signOn(),
      );
      expect(status).toBe(200);
      expect(result).toEqual({ result: "SUCCESS", queued: 0 });
      expect(queued()).toHaveLength(0);
    });
  });

  describe("invalid requests", () => {
    it('[SWHR-C-0313] rejects request type "DELETE" as unknown', async () => {
      const { status, result } = await call({ type: "DELETE" }, await signOn());
      expect(status).toBe(400);
      expect(result.error).toBe('Unable to process an unknown request type "DELETE"');
    });

    it("[SWHR-C-0314] answers a malformed body with an error asking to try again", async () => {
      const { status, result } = await call("not json{", await signOn());
      expect(status).toBe(400);
      expect(result.error).toMatch(/^Error processing request: .+ Please try again\.$/);
    });
  });

  describe("reports", () => {
    const window = { start: "01/01/2002", end: "12/31/2002" };

    function seedSales(): void {
      seed("2001", {
        lines: [{ categoryId: "FISH", itemId: "EST-1", quantity: 5, unitPrice: "12.00" }],
        total: "60.00",
      });
      seed("2002", {
        lines: [{ categoryId: "DOGS", itemId: "EST-9", quantity: 1, unitPrice: "500.00" }],
        total: "500.00",
      });
    }

    it("[SWHR-C-0315] reports revenue by category with a total", async () => {
      seedSales();
      const { status, result } = await call({ type: "REVENUE", ...window }, await signOn());
      expect(status).toBe(200);
      expect(result).toEqual({
        groups: [
          { name: "Dogs", value: "500.00" },
          { name: "Fish", value: "60.00" },
        ],
        total: "560.00",
      });
    });

    it("[SWHR-C-0316] reports revenue by item within a category", async () => {
      seed("2001", {
        lines: [
          { categoryId: "FISH", itemId: "EST-1", quantity: 1, unitPrice: "20.00" },
          { categoryId: "FISH", itemId: "EST-2", quantity: 1, unitPrice: "15.00" },
          { categoryId: "DOGS", itemId: "EST-9", quantity: 1, unitPrice: "500.00" },
        ],
      });
      const { result } = await call(
        { type: "REVENUE", category: "FISH", ...window },
        await signOn(),
      );
      expect(result).toEqual({
        groups: [
          { name: "EST-1", value: "20.00" },
          { name: "EST-2", value: "15.00" },
        ],
        total: "35.00",
      });
    });

    it("[SWHR-C-0317] reports quantities by category with a total", async () => {
      seedSales();
      const { result } = await call({ type: "ORDERS", ...window }, await signOn());
      expect(result).toEqual({
        groups: [
          { name: "Dogs", value: "1" },
          { name: "Fish", value: "5" },
        ],
        total: "6",
      });
    });

    it("[SWHR-C-0318] includes an order dated at the end of the window", async () => {
      seed("2001", { date: new Date("2002-12-31T23:59:59.999Z") });
      const { result } = await call({ type: "ORDERS", ...window }, await signOn());
      expect(result.total).toBe("1");
    });

    it("[SWHR-C-0319] counts a DENIED order in the window", async () => {
      seed("2001", { status: "DENIED" });
      const { result } = await call({ type: "REVENUE", ...window }, await signOn());
      expect(result.total).toBe("20.00");
    });

    it("excludes an order after the window and adds ja_JP lines in hundredths", async () => {
      seed("2001", { date: new Date("2003-01-01T00:00:00Z") });
      seed("2002", {
        locale: "ja_JP",
        lines: [{ categoryId: "FISH", itemId: "EST-1", quantity: 2, unitPrice: "1000" }],
        total: "2000",
      });
      const { result } = await call({ type: "REVENUE", ...window }, await signOn());
      expect(result.total).toBe("2000.00");
    });

    it("rejects an invalid date with the try-again error", async () => {
      const { status, result } = await call(
        { type: "REVENUE", start: "2002-01-01", end: "12/31/2002" },
        await signOn(),
      );
      expect(status).toBe(400);
      expect(result.error).toMatch(/Please try again\.$/);
    });
  });
});
