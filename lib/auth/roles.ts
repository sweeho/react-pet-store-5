import { and, eq, inArray } from "drizzle-orm";
import { createError, type H3Event } from "nitro/h3";

import { db } from "../../db/client";
import { groupMembers, roleAssignments } from "../../db/schema";
import type { AuthSession } from "./session";
import { getAuthSession } from "./session";

export type StaffRealm = "admin" | "supplier";

/**
 * design.md P10: direct assignment (`principalType: "user"`) or through
 * group membership (`principalType: "group"`, resolved via
 * `groupMembers`). Never read on the storefront (SWHR-R-0068).
 */
export function hasRole(userId: string, realm: StaffRealm, role: "administrator"): boolean {
  const direct = db
    .select()
    .from(roleAssignments)
    .where(
      and(
        eq(roleAssignments.realm, realm),
        eq(roleAssignments.role, role),
        eq(roleAssignments.principalType, "user"),
        eq(roleAssignments.principal, userId),
      ),
    )
    .get();
  if (direct) {
    return true;
  }

  const groups = db
    .select({ groupName: roleAssignments.principal })
    .from(roleAssignments)
    .where(
      and(
        eq(roleAssignments.realm, realm),
        eq(roleAssignments.role, role),
        eq(roleAssignments.principalType, "group"),
      ),
    )
    .all();
  if (groups.length === 0) {
    return false;
  }

  const membership = db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.userId, userId),
        inArray(
          groupMembers.groupName,
          groups.map((group) => group.groupName),
        ),
      ),
    )
    .get();
  return Boolean(membership);
}

/** design.md P10: 401 without a signed-on realm session, 403 without the role. */
export async function requireRole(
  event: H3Event,
  realm: StaffRealm,
  role: "administrator",
): Promise<AuthSession> {
  const session = await getAuthSession(event, realm);
  if (!session.signedOn || !session.userId) {
    throw createError({ statusCode: 401, statusMessage: "Sign-on required" });
  }
  if (!hasRole(session.userId, realm, role)) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }
  return session;
}
