import { defineHandler } from "nitro/h3";

import { endAuthSession } from "../../lib/auth/session";

/**
 * SWHR-R-0073: deletes the session row and its cart lines, keeping the
 * locale, which lives in a separate cookie field untouched by this call
 * (design.md P4). The next request gets a fresh anonymous session.
 */
export default defineHandler(async (event) => {
  await endAuthSession(event, "storefront");
  return { redirect: "/signed-out" };
});
