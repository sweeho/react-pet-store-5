import { defineHandler, getHeader } from "nitro/h3";

import { listSupplierOrders } from "../../../lib/b2b/exchange/supplierOrders";
import { findAuthSessionById, getAuthSession } from "../../../lib/auth/session";

const SESSION_HEADER_PREFIX = "Session ";
// SWHR-R-0080: the exact legacy ApplRequestProcessor reply text.
const SESSION_TIMED_OUT_ERROR =
  "Session Timed Out; Please exit and login as admin from the login page";

/**
 * design.md P11: needs a signed-on admin session, not the role — accepts
 * either the cookie or `Authorization: Session <id>` (the launch
 * descriptor's binding, SWHR-R-0081). No role or session check belongs to
 * `listSupplierOrders` itself (SWHR-R-0071); this route is the caller that
 * enforces it.
 */
export default defineHandler(async (event) => {
  const authHeader = getHeader(event, "authorization");
  const sessionId = authHeader?.startsWith(SESSION_HEADER_PREFIX)
    ? authHeader.slice(SESSION_HEADER_PREFIX.length)
    : null;

  const session = sessionId
    ? await findAuthSessionById(sessionId, "admin")
    : await getAuthSession(event, "admin");

  if (!session || !session.signedOn) {
    event.res.status = 401;
    return { error: SESSION_TIMED_OUT_ERROR };
  }

  return { orders: listSupplierOrders() };
});
