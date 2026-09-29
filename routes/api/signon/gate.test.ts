import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { users } from "../../../db/schema";
import { updateAuthSession } from "../../../lib/auth/session";
import getGate from "./gate.get";

function eventWithPath(path: string): H3Event {
  return new H3Event(new Request(`http://localhost/api/signon/gate?path=${path}`));
}

describe("GET /api/signon/gate", () => {
  it("allows an unprotected path", async () => {
    await expect(getGate(eventWithPath("/cart"))).resolves.toEqual({ allowed: true });
  });

  it("gates an anonymous request for a protected path", async () => {
    await expect(getGate(eventWithPath("/account"))).resolves.toEqual({
      allowed: false,
      redirect: "/signin",
    });
  });

  it("allows a protected path for a signed-on session", async () => {
    // sessions.userId references users.userId (FK now enforced).
    db.insert(users).values({ userId: "alice", passwordHash: "test-hash" }).run();

    const event = eventWithPath("/account");
    await updateAuthSession(event, "storefront", { userId: "alice", signedOn: true });

    await expect(getGate(event)).resolves.toEqual({ allowed: true });
  });

  it("rejects a request with no path", async () => {
    const event = new H3Event(new Request("http://localhost/api/signon/gate"));

    await expect(getGate(event)).rejects.toMatchObject({ status: 400 });
  });
});
