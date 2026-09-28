import { H3Event } from "nitro/h3";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../db/client";
import { sessions, supplierAddresses, supplierContacts, supplierOrders } from "../../../db/schema";
import { IDLE_TIMEOUT_MS, updateAuthSession } from "../../../lib/auth/session";
import getAdminOrders from "./orders.get";

const SESSION_TIMED_OUT_ERROR =
  "Session Timed Out; Please exit and login as admin from the login page";

beforeEach(() => {
  db.delete(supplierAddresses).run();
  db.delete(supplierContacts).run();
  db.delete(supplierOrders).run();
  db.delete(sessions).run();
});

function seedOrder(orderId: string): void {
  db.insert(supplierOrders)
    .values({ orderId, orderDate: new Date(2002, 2, 15), status: "PENDING", createdAt: new Date() })
    .run();
  db.insert(supplierContacts)
    .values({
      orderId,
      familyName: "Doe",
      givenName: "Jane",
      email: "jane@example.com",
      phone: "555-1234",
    })
    .run();
  db.insert(supplierAddresses)
    .values({
      orderId,
      streetName1: "1 Main St",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      country: "USA",
    })
    .run();
}

function cookieFrom(event: H3Event): string {
  return event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
}

describe("GET /api/admin/orders", () => {
  it("returns 401 with the timeout message and no data for an anonymous caller", async () => {
    seedOrder("1001");
    const event = new H3Event(new Request("http://localhost/api/admin/orders"));

    const result = await getAdminOrders(event);

    expect(event.res.status).toBe(401);
    expect(result).toEqual({ error: SESSION_TIMED_OUT_ERROR });
  });

  /** SWHR-R-0080.01 */
  it("[SWHR-C-0144] returns 401 with the timeout message and no data for an expired session", async () => {
    seedOrder("1001");
    vi.useFakeTimers();
    try {
      vi.setSystemTime(0);
      const signOn = new H3Event(new Request("http://localhost/"));
      await updateAuthSession(signOn, "admin", { userId: "jps_admin", signedOn: true });

      vi.setSystemTime(IDLE_TIMEOUT_MS.admin + 60_000);
      const event = new H3Event(
        new Request("http://localhost/api/admin/orders", {
          headers: { cookie: cookieFrom(signOn) },
        }),
      );
      const result = await getAdminOrders(event);

      expect(event.res.status).toBe(401);
      expect(result).toEqual({ error: SESSION_TIMED_OUT_ERROR });
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns the supplier orders for a signed-on admin session (role not required)", async () => {
    seedOrder("1001");
    const signOn = new H3Event(new Request("http://localhost/"));
    await updateAuthSession(signOn, "admin", { userId: "not-an-administrator", signedOn: true });

    const event = new H3Event(
      new Request("http://localhost/api/admin/orders", { headers: { cookie: cookieFrom(signOn) } }),
    );
    const result = await getAdminOrders(event);

    expect(result.orders).toEqual([expect.objectContaining({ orderId: "1001" })]);
  });

  it("accepts an Authorization: Session <id> header carrying a live admin session", async () => {
    seedOrder("1001");
    const signOn = new H3Event(new Request("http://localhost/"));
    const session = await updateAuthSession(signOn, "admin", {
      userId: "jps_admin",
      signedOn: true,
    });

    const event = new H3Event(
      new Request("http://localhost/api/admin/orders", {
        headers: { authorization: `Session ${session.id}` },
      }),
    );
    const result = await getAdminOrders(event);

    expect(result.orders).toEqual([expect.objectContaining({ orderId: "1001" })]);
  });

  it("returns the timeout message for an unknown session id in the Authorization header", async () => {
    seedOrder("1001");
    const event = new H3Event(
      new Request("http://localhost/api/admin/orders", {
        headers: { authorization: "Session does-not-exist" },
      }),
    );

    const result = await getAdminOrders(event);

    expect(event.res.status).toBe(401);
    expect(result).toEqual({ error: SESSION_TIMED_OUT_ERROR });
  });
});
