import { H3Event } from "nitro/h3";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { groupMembers, roleAssignments, sessions, users } from "../../db/schema";
import { updateAuthSession } from "./session";
import { hasRole, requireRole } from "./roles";

beforeEach(() => {
  db.delete(groupMembers).run();
  db.delete(roleAssignments).run();
  db.delete(sessions).run();
});

describe("hasRole", () => {
  it("grants the role for a direct user assignment", () => {
    db.insert(roleAssignments)
      .values({
        realm: "admin",
        role: "administrator",
        principalType: "user",
        principal: "jps_admin",
      })
      .run();

    expect(hasRole("jps_admin", "admin", "administrator")).toBe(true);
  });

  it("grants the role through group membership", () => {
    db.insert(roleAssignments)
      .values({
        realm: "supplier",
        role: "administrator",
        principalType: "group",
        principal: "administrator_group",
      })
      .run();
    // groupMembers.userId references users.userId (FK now enforced).
    db.insert(users).values({ userId: "supplier_staff", passwordHash: "test-hash" }).run();
    db.insert(groupMembers)
      .values({ groupName: "administrator_group", userId: "supplier_staff" })
      .run();

    expect(hasRole("supplier_staff", "supplier", "administrator")).toBe(true);
  });

  it("refuses a user with no assignment and no group membership", () => {
    expect(hasRole("nobody", "admin", "administrator")).toBe(false);
  });

  it("does not grant a realm's role in a different realm", () => {
    db.insert(roleAssignments)
      .values({
        realm: "supplier",
        role: "administrator",
        principalType: "user",
        principal: "supplier",
      })
      .run();

    expect(hasRole("supplier", "admin", "administrator")).toBe(false);
  });
});

describe("requireRole", () => {
  it("rejects with 401 when the realm session is not signed on", async () => {
    const event = new H3Event(new Request("http://localhost/"));

    await expect(requireRole(event, "admin", "administrator")).rejects.toMatchObject({
      status: 401,
    });
  });

  it("rejects with 403 when signed on without the role", async () => {
    const event = new H3Event(new Request("http://localhost/"));
    // sessions.userId references users.userId (FK now enforced).
    db.insert(users).values({ userId: "carol", passwordHash: "test-hash" }).run();
    await updateAuthSession(event, "admin", { userId: "carol", signedOn: true });

    await expect(requireRole(event, "admin", "administrator")).rejects.toMatchObject({
      status: 403,
    });
  });

  it("returns the session when signed on with the role", async () => {
    db.insert(roleAssignments)
      .values({
        realm: "admin",
        role: "administrator",
        principalType: "user",
        principal: "jps_admin",
      })
      .run();
    const event = new H3Event(new Request("http://localhost/"));
    await updateAuthSession(event, "admin", { userId: "jps_admin", signedOn: true });

    await expect(requireRole(event, "admin", "administrator")).resolves.toMatchObject({
      userId: "jps_admin",
      signedOn: true,
    });
  });
});
