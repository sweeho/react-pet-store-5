import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { updateAuthSession } from "../../lib/auth/session";
import getSession from "./session.get";

describe("GET /api/session", () => {
  it("reports an anonymous visitor as not signed on", async () => {
    const event = new H3Event(new Request("http://localhost/api/session"));

    await expect(getSession(event)).resolves.toEqual({ signedOn: false, userId: null });
  });

  it("reports a signed-on visitor's user id", async () => {
    const event = new H3Event(new Request("http://localhost/api/session"));
    await updateAuthSession(event, "storefront", { userId: "alice", signedOn: true });

    await expect(getSession(event)).resolves.toEqual({ signedOn: true, userId: "alice" });
  });
});
