import { createError, defineHandler, getQuery } from "nitro/h3";

import { checkGate } from "../../../lib/auth/protection";

// The SPA route guard (design.md P6) — called only for a path the SPA
// already knows is protected, from GET /api/signon/config's list.
export default defineHandler(async (event) => {
  const query = getQuery(event);
  const path = typeof query.path === "string" ? query.path : "";
  if (!path) {
    throw createError({ statusCode: 400, statusMessage: "path is required" });
  }

  return checkGate(event, path);
});
