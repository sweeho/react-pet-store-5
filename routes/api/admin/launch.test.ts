import { H3Event } from "nitro/h3";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import {
  roleAssignments,
  sessions,
  supplierAddresses,
  supplierContacts,
  supplierOrders,
} from "../../../db/schema";
import { updateAuthSession } from "../../../lib/auth/session";
import getAdminLaunch from "./launch.get";
import getAdminOrders from "./orders.get";

beforeEach(() => {
  db.delete(roleAssignments).run();
  db.delete(supplierAddresses).run();
  db.delete(supplierContacts).run();
  db.delete(supplierOrders).run();
  db.delete(sessions).run();
});

function cookieFrom(event: H3Event): string {
  return event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
}

describe("GET /api/admin/launch", () => {
  it("rejects a caller without the administrator role", async () => {
    const signOn = new H3Event(new Request("http://localhost/"));
    await updateAuthSession(signOn, "admin", { userId: "not-an-administrator", signedOn: true });

    const event = new H3Event(
      new Request("http://localhost/api/admin/launch", { headers: { cookie: cookieFrom(signOn) } }),
    );

    await expect(getAdminLaunch(event)).rejects.toMatchObject({ status: 403 });
  });

  /** SWHR-R-0081.01 */
  it("[SWHR-C-0145] returns a session-bound descriptor whose session succeeds against the order-data endpoint with no re-sign-in", async () => {
    db.insert(supplierOrders)
      .values({
        orderId: "1001",
        orderDate: new Date(2002, 2, 15),
        status: "PENDING",
        createdAt: new Date(),
      })
      .run();
    db.insert(supplierContacts)
      .values({
        orderId: "1001",
        familyName: "Doe",
        givenName: "Jane",
        email: "jane@example.com",
        phone: "555-1234",
      })
      .run();
    db.insert(supplierAddresses)
      .values({
        orderId: "1001",
        streetName1: "1 Main St",
        city: "Springfield",
        state: "IL",
        zipCode: "62701",
        country: "USA",
      })
      .run();
    db.insert(roleAssignments)
      .values({
        realm: "admin",
        role: "administrator",
        principalType: "user",
        principal: "jps_admin",
      })
      .run();

    const signOn = new H3Event(new Request("http://localhost/"));
    const session = await updateAuthSession(signOn, "admin", {
      userId: "jps_admin",
      signedOn: true,
    });

    const launchEvent = new H3Event(
      new Request("http://localhost/api/admin/launch", { headers: { cookie: cookieFrom(signOn) } }),
    );
    const descriptor = await getAdminLaunch(launchEvent);

    expect(descriptor.sessionId).toBe(session.id);

    // The client's next request carries only the descriptor's session id
    // (SWHR-R-0081) — no cookie, no fresh sign-on.
    const ordersEvent = new H3Event(
      new Request("http://localhost/api/admin/orders", {
        headers: { authorization: `Session ${descriptor.sessionId}` },
      }),
    );
    const orders = await getAdminOrders(ordersEvent);

    expect(ordersEvent.res.status).not.toBe(401);
    expect("orders" in orders && orders.orders).toEqual([
      expect.objectContaining({ orderId: "1001" }),
    ]);
  });
});
