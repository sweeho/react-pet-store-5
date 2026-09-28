import { createError, defineHandler, readBody } from "nitro/h3";

import type { StaffRealm } from "../../../lib/auth/roles";
import { endAuthSession } from "../../../lib/auth/session";

const STAFF_REALMS: readonly StaffRealm[] = ["admin", "supplier"];
// design.md P10/P12: admin sign-off returns to the admin landing page;
// supplier sign-off shows the supplier signed-out page (SWHR-R-0078,
// SWHR-R-0083).
const SIGNOFF_REDIRECT: Record<StaffRealm, string> = {
  admin: "/admin",
  supplier: "/supplier/signed-out",
};

function parseRealm(value: unknown): StaffRealm | null {
  return typeof value === "string" && (STAFF_REALMS as string[]).includes(value)
    ? (value as StaffRealm)
    : null;
}

export default defineHandler(async (event) => {
  const body = await readBody<{ realm?: unknown }>(event);
  const realm = parseRealm(body?.realm);
  if (!realm) {
    throw createError({ statusCode: 400, statusMessage: "realm must be admin or supplier" });
  }

  await endAuthSession(event, realm);
  return { redirect: SIGNOFF_REDIRECT[realm] };
});
