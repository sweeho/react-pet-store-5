import { createError, defineHandler, getQuery } from "nitro/h3";

import { hasRole } from "../../../lib/auth/roles";
import type { StaffRealm } from "../../../lib/auth/roles";
import { getAuthSession } from "../../../lib/auth/session";

const STAFF_REALMS: readonly StaffRealm[] = ["admin", "supplier"];

function parseRealm(value: unknown): StaffRealm | null {
  return typeof value === "string" && (STAFF_REALMS as string[]).includes(value)
    ? (value as StaffRealm)
    : null;
}

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const realm = parseRealm(query.realm);
  if (!realm) {
    throw createError({ statusCode: 400, statusMessage: "realm must be admin or supplier" });
  }

  const session = await getAuthSession(event, realm);
  const isAdministrator =
    session.signedOn && session.userId ? hasRole(session.userId, realm, "administrator") : false;

  return { signedOn: session.signedOn, userId: session.userId, isAdministrator };
});
