import { defineHandler, readBody } from "nitro/h3";

import type { CredentialError } from "../../../lib/auth/credentials";
import { createCredential } from "../../../lib/auth/credentials";
import { updateAuthSession } from "../../../lib/auth/session";

// SWHR-R-0069: needs no prior sign-on — never calls requireSignOn.
const RULE_ERRORS = new Set<CredentialError>([
  "missing",
  "user-id-too-long",
  "user-id-wildcard",
  "password-too-long",
]);

export default defineHandler(async (event) => {
  const body = await readBody<{ userId?: unknown; password?: unknown }>(event);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const created = await createCredential(userId, password);
  if (!created.ok) {
    event.res.status = RULE_ERRORS.has(created.error) ? 400 : 409;
    return { redirect: "/user-creation-error", error: created.error };
  }

  // Pending registration (design.md P7/P8): userId set, not yet signed on.
  await updateAuthSession(event, "storefront", { userId, signedOn: false });

  event.res.status = 201;
  return { redirect: "/register" };
});
