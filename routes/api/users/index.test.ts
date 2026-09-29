import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { groupMembers, sessions, users } from "../../../db/schema";
import { getAuthSession } from "../../../lib/auth/session";
import postUsers from "./index.post";

beforeEach(() => {
  db.delete(sessions).run();
  // groupMembers.userId references users.userId (FK now enforced) — the
  // dev seed's admin_member row must go before users.
  db.delete(groupMembers).run();
  db.delete(users).run();
});

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function cookieFrom(event: H3Event): string {
  return event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
}

describe("POST /api/users", () => {
  /** SWHR-R-0069.01 */
  it("[SWHR-C-0129] creates a credential for an anonymous caller with no prior sign-on", async () => {
    const event = new H3Event(postRequest({ userId: "erin", password: "Secret1" }));

    const result = await postUsers(event);

    expect(event.res.status).toBe(201);
    expect(result).toEqual({ redirect: "/register" });
    expect(db.select().from(users).where(eq(users.userId, "erin")).all()).toHaveLength(1);
  });

  it("marks the session as a pending registration: userId set, not yet signed on", async () => {
    const event = new H3Event(postRequest({ userId: "erin", password: "Secret1" }));
    await postUsers(event);

    const session = await getAuthSession(
      new H3Event(new Request("http://localhost/", { headers: { cookie: cookieFrom(event) } })),
      "storefront",
    );

    expect(session).toMatchObject({ userId: "erin", signedOn: false });
  });

  it("rejects a duplicate user id with 409 and the user-creation-error redirect", async () => {
    await postUsers(new H3Event(postRequest({ userId: "erin", password: "Secret1" })));

    const event = new H3Event(postRequest({ userId: "erin", password: "Other1" }));
    const result = await postUsers(event);

    expect(event.res.status).toBe(409);
    expect(result).toEqual({ redirect: "/user-creation-error", error: "duplicate" });
  });

  it("rejects a missing password with 400 and the user-creation-error redirect", async () => {
    const event = new H3Event(postRequest({ userId: "erin" }));

    const result = await postUsers(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ redirect: "/user-creation-error", error: "missing" });
  });
});
