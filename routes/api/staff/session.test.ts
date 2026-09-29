import { H3Event } from "nitro/h3";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../db/client";
import { roleAssignments, sessions, users } from "../../../db/schema";
import { IDLE_TIMEOUT_MS, updateAuthSession } from "../../../lib/auth/session";
import getStaffSession from "./session.get";

function cookieFrom(event: H3Event): string {
  return event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
}

beforeEach(() => {
  db.delete(roleAssignments).run();
  db.delete(sessions).run();
});

describe("GET /api/staff/session", () => {
  it("reports an anonymous visitor as not signed on and not an administrator", async () => {
    const event = new H3Event(new Request("http://localhost/api/staff/session?realm=admin"));

    await expect(getStaffSession(event)).resolves.toEqual({
      signedOn: false,
      userId: null,
      isAdministrator: false,
    });
  });

  it("reports isAdministrator true for a signed-on user holding the role", async () => {
    db.insert(roleAssignments)
      .values({
        realm: "admin",
        role: "administrator",
        principalType: "user",
        principal: "jps_admin",
      })
      .run();
    const event = new H3Event(new Request("http://localhost/api/staff/session?realm=admin"));
    await updateAuthSession(event, "admin", { userId: "jps_admin", signedOn: true });

    await expect(getStaffSession(event)).resolves.toEqual({
      signedOn: true,
      userId: "jps_admin",
      isAdministrator: true,
    });
  });

  it("reports isAdministrator false for a signed-on user without the role", async () => {
    const event = new H3Event(new Request("http://localhost/api/staff/session?realm=admin"));
    // sessions.userId references users.userId (FK now enforced).
    db.insert(users).values({ userId: "carol", passwordHash: "test-hash" }).run();
    await updateAuthSession(event, "admin", { userId: "carol", signedOn: true });

    await expect(getStaffSession(event)).resolves.toEqual({
      signedOn: true,
      userId: "carol",
      isAdministrator: false,
    });
  });

  it("rejects a realm other than admin or supplier", async () => {
    const event = new H3Event(new Request("http://localhost/api/staff/session?realm=storefront"));

    await expect(getStaffSession(event)).rejects.toMatchObject({ status: 400 });
  });

  /** SWHR-R-0079.01 — the client-side redirect to the sign-in form is console.test.tsx's, driven off this `signedOn: false`. */
  it("[SWHR-C-0143] reports not signed on for an administrator idle past the 54-minute admin timeout", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(0);
      const signOn = new H3Event(new Request("http://localhost/"));
      await updateAuthSession(signOn, "admin", { userId: "jps_admin", signedOn: true });

      vi.setSystemTime(IDLE_TIMEOUT_MS.admin + 60_000);
      const followUp = new H3Event(
        new Request("http://localhost/api/staff/session?realm=admin", {
          headers: { cookie: cookieFrom(signOn) },
        }),
      );

      await expect(getStaffSession(followUp)).resolves.toMatchObject({ signedOn: false });
    } finally {
      vi.useRealTimers();
    }
  });
});
