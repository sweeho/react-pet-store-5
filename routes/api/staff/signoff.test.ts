import { H3Event } from "nitro/h3";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { sessions } from "../../../db/schema";
import { updateAuthSession } from "../../../lib/auth/session";
import getStaffSession from "./session.get";
import postStaffSignoff from "./signoff.post";

beforeEach(() => {
  db.delete(sessions).run();
});

function cookieFrom(event: H3Event): string {
  return event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
}

describe("POST /api/staff/signoff", () => {
  /** SWHR-R-0078.01 — the administration landing page's own content is not this route's to assert (a client page). */
  it("[SWHR-C-0142] ends the admin session; the follow-up session check shows not signed on", async () => {
    const signedIn = new H3Event(new Request("http://localhost/"));
    await updateAuthSession(signedIn, "admin", { userId: "jps_admin", signedOn: true });

    const signoffBody = JSON.stringify({ realm: "admin" });
    const signoffEvent = new H3Event(
      new Request("http://localhost/api/staff/signoff", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: cookieFrom(signedIn) },
        body: signoffBody,
      }),
    );
    const result = await postStaffSignoff(signoffEvent);

    expect(result).toEqual({ redirect: "/admin" });

    const followUp = new H3Event(
      new Request("http://localhost/api/staff/session?realm=admin", {
        headers: { cookie: cookieFrom(signedIn) },
      }),
    );
    await expect(getStaffSession(followUp)).resolves.toMatchObject({ signedOn: false });
  });

  /** SWHR-R-0083.01 — the signed-out page's own link is asserted in supplier/signed-out.test.tsx. */
  it("[SWHR-C-0147] ends the supplier session; the follow-up session check shows not signed on", async () => {
    const signedIn = new H3Event(new Request("http://localhost/"));
    await updateAuthSession(signedIn, "supplier", { userId: "supplier", signedOn: true });

    const signoffEvent = new H3Event(
      new Request("http://localhost/api/staff/signoff", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: cookieFrom(signedIn) },
        body: JSON.stringify({ realm: "supplier" }),
      }),
    );
    const result = await postStaffSignoff(signoffEvent);

    expect(result).toEqual({ redirect: "/supplier/signed-out" });

    const followUp = new H3Event(
      new Request("http://localhost/api/staff/session?realm=supplier", {
        headers: { cookie: cookieFrom(signedIn) },
      }),
    );
    await expect(getStaffSession(followUp)).resolves.toMatchObject({ signedOn: false });
  });

  it("rejects a realm other than admin or supplier", async () => {
    const event = new H3Event(
      new Request("http://localhost/api/staff/signoff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ realm: "storefront" }),
      }),
    );

    await expect(postStaffSignoff(event)).rejects.toMatchObject({ status: 400 });
  });
});
