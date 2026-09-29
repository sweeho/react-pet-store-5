import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../db/client";
import { customers, groupMembers, sessions, users } from "../../../db/schema";
import { createCredential } from "../../../lib/auth/credentials";
import { updateAuthSession } from "../../../lib/auth/session";
import signonMiddleware from "../../../middleware/signon";
import lastOrder from "./last.get";

async function signIn(userId: string): Promise<{ cookie: string; sessionId: string }> {
  await createCredential(userId, "Secret1");
  const event = new H3Event(new Request("http://localhost/"));
  const session = await updateAuthSession(event, "storefront", { userId, signedOn: true });
  const cookie = event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
  return { cookie, sessionId: session.id };
}

function get(cookie?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/orders/last", cookie ? { headers: { cookie } } : undefined),
  );
}

beforeEach(() => {
  db.delete(customers).run();
  db.delete(sessions).run();
  db.delete(groupMembers).run();
  db.delete(users).run();
  vi.restoreAllMocks();
});

describe("GET /api/orders/last", () => {
  it("[SWHR-C-0261] sends an anonymous request for the order screen to sign in", async () => {
    const result = await signonMiddleware(new H3Event(new Request("http://localhost/checkout")));

    expect(result?.headers.get("location")).toBe("/signin");
    await expect(Promise.resolve(lastOrder(get()))).rejects.toMatchObject({ status: 401 });
  });

  it("answers the session's last order id and e-mail", async () => {
    const { cookie, sessionId } = await signIn("j2ee");
    db.update(sessions)
      .set({ lastOrderId: "10017", lastOrderEmail: "jane@example.com" })
      .where(eq(sessions.id, sessionId))
      .run();

    await expect(lastOrder(get(cookie))).resolves.toEqual({
      orderId: "10017",
      email: "jane@example.com",
    });
  });

  it("answers 404 when the session has placed no order", async () => {
    const { cookie } = await signIn("j2ee");

    await expect(Promise.resolve(lastOrder(get(cookie)))).rejects.toMatchObject({ status: 404 });
  });

  it("[SWHR-C-0286] still answers 200 with the order when no transaction can be started", async () => {
    const { cookie, sessionId } = await signIn("j2ee");
    db.update(sessions)
      .set({ lastOrderId: "10017", lastOrderEmail: "jane@example.com" })
      .where(eq(sessions.id, sessionId))
      .run();
    vi.spyOn(db, "transaction").mockImplementation(() => {
      throw new Error("cannot start a transaction");
    });
    const event = get(cookie);

    const result = await lastOrder(event);

    expect(event.res.status ?? 200).toBe(200);
    expect(result).toEqual({ orderId: "10017", email: "jane@example.com" });
  });
});
