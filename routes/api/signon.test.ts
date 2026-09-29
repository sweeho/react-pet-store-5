import { H3Event } from "nitro/h3";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { groupMembers, sessions, users } from "../../db/schema";
import { createCredential } from "../../lib/auth/credentials";
import { getAuthSession, updateAuthSession } from "../../lib/auth/session";
import postSignon from "./signon.post";

beforeEach(() => {
  db.delete(sessions).run();
  // groupMembers.userId references users.userId (FK now enforced) — the
  // dev seed's admin_member row must go before users.
  db.delete(groupMembers).run();
  db.delete(users).run();
});

function cookieFrom(event: H3Event): string {
  return event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
}

function setCookieEntry(event: H3Event, name: string): string | undefined {
  return event.res.headers.getSetCookie().find((entry) => entry.startsWith(`${name}=`));
}

function postRequest(body: unknown, cookie?: string): Request {
  return new Request("http://localhost/api/signon", {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

function eventWithCookie(cookie: string): H3Event {
  return new H3Event(new Request("http://localhost/", { headers: { cookie } }));
}

describe("POST /api/signon", () => {
  /** SWHR-R-0062.02 */
  it("[SWHR-C-0118] redirects to the sign-in error screen and leaves the session not signed on for invalid credentials", async () => {
    await createCredential("alice", "Secret1");
    const setup = new H3Event(new Request("http://localhost/"));
    const before = await getAuthSession(setup, "storefront");

    const event = new H3Event(
      postRequest({ userId: "alice", password: "wrong" }, cookieFrom(setup)),
    );
    const result = await postSignon(event);

    expect(event.res.status).toBe(401);
    expect(result).toEqual({ redirect: "/signin-error" });

    const after = await getAuthSession(eventWithCookie(cookieFrom(setup)), "storefront");
    expect(after.id).toBe(before.id);
    expect(after.signedOn).toBe(false);
    expect(after.userId).toBeNull();
  });

  /** SWHR-R-0063.01 */
  it("[SWHR-C-0119] sets a 31-day user-name cookie when remember is selected", async () => {
    await createCredential("alice", "Secret1");

    const event = new H3Event(
      postRequest({ userId: "alice", password: "Secret1", remember: true }),
    );
    await postSignon(event);

    const cookie = setCookieEntry(event, "signon_username");
    expect(cookie).toContain("signon_username=alice");
    expect(cookie).toMatch(/Max-Age=2678400/);
  });

  /** SWHR-R-0063.02 */
  it("[SWHR-C-0120] clears the user-name cookie when remember is not selected", async () => {
    await createCredential("alice", "Secret1");

    const event = new H3Event(
      postRequest({ userId: "alice", password: "Secret1" }, "signon_username=alice"),
    );
    await postSignon(event);

    const cookie = setCookieEntry(event, "signon_username");
    expect(cookie).toMatch(/Max-Age=0/);
  });

  // Server half of SWHR-C-0117 (SWHR-T-0048 drives the browser flow).
  it("signs the session on and redirects to the originally requested page", async () => {
    await createCredential("alice", "Secret1");
    const gated = new H3Event(new Request("http://localhost/"));
    await updateAuthSession(gated, "storefront", { originalUrl: "/account" });

    const event = new H3Event(
      postRequest({ userId: "alice", password: "Secret1" }, cookieFrom(gated)),
    );
    const result = await postSignon(event);

    expect(result).toEqual({ redirect: "/account" });
    const session = await getAuthSession(eventWithCookie(cookieFrom(gated)), "storefront");
    expect(session).toMatchObject({ signedOn: true, userId: "alice" });
  });

  it("redirects to the home page when there is no originally requested page", async () => {
    await createCredential("alice", "Secret1");

    const event = new H3Event(postRequest({ userId: "alice", password: "Secret1" }));
    const result = await postSignon(event);

    expect(result).toEqual({ redirect: "/" });
  });
});
