import { H3Event } from "nitro/h3";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { sessions, users } from "../../../db/schema";
import { createCredential } from "../../../lib/auth/credentials";
import { getAuthSession } from "../../../lib/auth/session";
import postStaffSignon from "./signon.post";

beforeEach(() => {
  db.delete(sessions).run();
  db.delete(users).run();
});

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/staff/signon", {
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

describe("POST /api/staff/signon", () => {
  /** SWHR-R-0077.01 — the login-error page's own content and sign-in link are covered by admin/login-error.test.tsx. */
  it("[SWHR-C-0141] rejects the wrong password with the login-error redirect and creates no session", async () => {
    await createCredential("admin", "Secret1");

    const event = new H3Event(postRequest({ realm: "admin", userId: "admin", password: "wrong" }));
    const result = await postStaffSignon(event);

    expect(event.res.status).toBe(401);
    expect(result).toEqual({ redirect: "/admin/login-error" });

    const session = await getAuthSession(
      new H3Event(new Request("http://localhost/", { headers: { cookie: cookieFrom(event) } })),
      "admin",
    );
    expect(session.signedOn).toBe(false);
    expect(session.userId).toBeNull();
  });

  it("signs the admin session on and redirects to the console on success", async () => {
    await createCredential("jps_admin", "Secret1");

    const event = new H3Event(
      postRequest({ realm: "admin", userId: "jps_admin", password: "Secret1" }),
    );
    const result = await postStaffSignon(event);

    expect(result).toEqual({ redirect: "/admin/console" });
    const session = await getAuthSession(
      new H3Event(new Request("http://localhost/", { headers: { cookie: cookieFrom(event) } })),
      "admin",
    );
    expect(session).toMatchObject({ userId: "jps_admin", signedOn: true });
  });

  it("signs the supplier session on and redirects to the inventory page on success", async () => {
    await createCredential("supplier", "Secret1");

    const event = new H3Event(
      postRequest({ realm: "supplier", userId: "supplier", password: "Secret1" }),
    );
    const result = await postStaffSignon(event);

    expect(result).toEqual({ redirect: "/supplier" });
    const session = await getAuthSession(
      new H3Event(new Request("http://localhost/", { headers: { cookie: cookieFrom(event) } })),
      "supplier",
    );
    expect(session).toMatchObject({ userId: "supplier", signedOn: true });
  });

  it("rejects a realm other than admin or supplier", async () => {
    const event = new H3Event(
      postRequest({ realm: "storefront", userId: "alice", password: "Secret1" }),
    );

    await expect(postStaffSignon(event)).rejects.toMatchObject({ status: 400 });
  });
});
