import { createError, defineHandler, readBody } from "nitro/h3";

import { authenticate } from "../../../lib/auth/credentials";
import type { StaffRealm } from "../../../lib/auth/roles";
import { updateAuthSession } from "../../../lib/auth/session";

const STAFF_REALMS: readonly StaffRealm[] = ["admin", "supplier"];
// P12: the realm's own signed-on landing page.
const LANDING_PAGE: Record<StaffRealm, string> = {
  admin: "/admin/console",
  supplier: "/supplier",
};

function parseRealm(value: unknown): StaffRealm | null {
  return typeof value === "string" && (STAFF_REALMS as string[]).includes(value)
    ? (value as StaffRealm)
    : null;
}

export default defineHandler(async (event) => {
  const body = await readBody<{ realm?: unknown; userId?: unknown; password?: unknown }>(event);
  const realm = parseRealm(body?.realm);
  if (!realm) {
    throw createError({ statusCode: 400, statusMessage: "realm must be admin or supplier" });
  }
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const authenticated = await authenticate(userId, password);
  if (!authenticated) {
    event.res.status = 401;
    return { redirect: `/${realm}/login-error` };
  }

  await updateAuthSession(event, realm, { userId, signedOn: true });
  return { redirect: LANDING_PAGE[realm] };
});
