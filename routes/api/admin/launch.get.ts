import { defineHandler } from "nitro/h3";

import { requireRole } from "../../../lib/auth/roles";

// The rebuilt stack is one server (AGENTS.md — Vite + Nitro on :5000), so
// the launch descriptor points the (out-of-scope, OQ-6) order client back
// at it rather than a separate admin host/port.
const ADMIN_HOST = "localhost";
const ADMIN_PORT = 5000;

/** design.md P11 (SWHR-R-0081): needs the role, not just the session. */
export default defineHandler(async (event) => {
  const session = await requireRole(event, "admin", "administrator");

  return {
    host: ADMIN_HOST,
    port: ADMIN_PORT,
    sessionId: session.id,
    ordersUrl: "/api/admin/orders",
  };
});
