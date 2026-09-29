import { getHeader, type H3Event } from "nitro/h3";

import { findAuthSessionById, getAuthSession, type AuthSession } from "./session";

const SESSION_HEADER_PREFIX = "Session ";

/**
 * design.md P6: a signed-on admin session (the role is not required), from
 * the cookie or `Authorization: Session <id>`. Same rule as
 * `GET /api/admin/orders`.
 */
export async function requireAdminDataSession(event: H3Event): Promise<AuthSession | null> {
  const authHeader = getHeader(event, "authorization");
  const sessionId = authHeader?.startsWith(SESSION_HEADER_PREFIX)
    ? authHeader.slice(SESSION_HEADER_PREFIX.length)
    : null;

  const session = sessionId
    ? await findAuthSessionById(sessionId, "admin")
    : await getAuthSession(event, "admin");

  return session?.signedOn ? session : null;
}
