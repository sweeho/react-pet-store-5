import { defineHandler, deleteCookie, readBody, setCookie } from "nitro/h3";

import { authenticate } from "../../lib/auth/credentials";
import { getProtectionConfig } from "../../lib/auth/protection";
import { updateAuthSession } from "../../lib/auth/session";
import { applyPreferredLanguageOnSignOn } from "../../lib/locale/preference";

const REMEMBER_COOKIE_NAME = "signon_username";
// 31 days (SWHR-R-0063), the legacy bp_signon cookie's own lifetime.
const REMEMBER_COOKIE_MAX_AGE_SECONDS = 2678400;

/**
 * SWHR-R-0062, SWHR-R-0063: the remember cookie is written or cleared
 * before authentication runs, even on a failed sign-on (design.md P7,
 * OQ-4) — readable by the SPA, so not HttpOnly.
 */
export default defineHandler(async (event) => {
  const body = await readBody<{ userId?: unknown; password?: unknown; remember?: unknown }>(event);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const remember = body?.remember === true;

  if (remember) {
    setCookie(event, REMEMBER_COOKIE_NAME, userId, {
      maxAge: REMEMBER_COOKIE_MAX_AGE_SECONDS,
      httpOnly: false,
    });
  } else {
    deleteCookie(event, REMEMBER_COOKIE_NAME, { httpOnly: false });
  }

  const authenticated = await authenticate(userId, password);
  if (!authenticated) {
    event.res.status = 401;
    return { redirect: getProtectionConfig().signOnErrorPage };
  }

  const session = await updateAuthSession(event, "storefront", { userId, signedOn: true });
  await applyPreferredLanguageOnSignOn(event, userId);

  return { redirect: session.originalUrl ?? "/" };
});
