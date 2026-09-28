import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import type { H3Event } from "nitro/h3";
import { useSession } from "nitro/h3";

import { db } from "../../db/client";
import { sessions } from "../../db/schema";
import { sessionPassword } from "../locale/session";
import { deleteCartLinesForSession } from "../cart/lines";

export type Realm = "storefront" | "admin" | "supplier";

// design.md P4: storefront 15 min, admin and supplier 54 min.
export const IDLE_TIMEOUT_MS: Record<Realm, number> = {
  storefront: 15 * 60 * 1000,
  admin: 54 * 60 * 1000,
  supplier: 54 * 60 * 1000,
};

export interface AuthSession {
  id: string;
  realm: Realm;
  userId: string | null;
  signedOn: boolean;
  originalUrl: string | null;
}

interface AuthCookieData {
  // Keyed next to the locale in the same sealed cookie (P4), one id per
  // realm — each realm is independent, so there is no single sign-on.
  authSessions?: Partial<Record<Realm, string>>;
}

function authCookie(event: H3Event) {
  // Not a React hook: h3's useSession() is a plain server-side session
  // helper (see lib/locale/session.ts). Calling it here with no `name`
  // uses the same default cookie name as localeSession, so both read and
  // write the one sealed cookie.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSession<AuthCookieData>(event, { password: sessionPassword() });
}

interface SessionRow {
  id: string;
  realm: Realm;
  userId: string | null;
  signedOn: boolean;
  originalUrl: string | null;
  lastSeenAt: Date;
  createdAt: Date;
}

function toAuthSession(row: SessionRow): AuthSession {
  return {
    id: row.id,
    realm: row.realm,
    userId: row.userId,
    signedOn: row.signedOn,
    originalUrl: row.originalUrl,
  };
}

function isIdleExpired(row: SessionRow, now: number): boolean {
  return now - row.lastSeenAt.getTime() > IDLE_TIMEOUT_MS[row.realm];
}

// Deletes the row and its cart lines (P4, P9) — called both when a session
// ends explicitly (sign-out) and when a lookup finds it idle-expired.
function endSessionRow(id: string): void {
  deleteCartLinesForSession(id);
  db.delete(sessions).where(eq(sessions.id, id)).run();
}

function createAnonymousSessionRow(realm: Realm, now: number): SessionRow {
  const row: SessionRow = {
    id: randomUUID(),
    realm,
    userId: null,
    signedOn: false,
    originalUrl: null,
    lastSeenAt: new Date(now),
    createdAt: new Date(now),
  };
  db.insert(sessions).values(row).run();
  return row;
}

function findRow(id: string, realm: Realm): SessionRow | null {
  const row = db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.realm, realm)))
    .get();
  return (row as SessionRow | undefined) ?? null;
}

/**
 * Expires an idle row and touches `lastSeenAt` on a live one (P4). Always
 * returns a session: a missing or idle-expired row is replaced with a
 * fresh anonymous one, and its id is written back to the cookie.
 */
export async function getAuthSession(event: H3Event, realm: Realm): Promise<AuthSession> {
  const cookie = await authCookie(event);
  const existingId = cookie.data.authSessions?.[realm];
  const now = Date.now();

  if (existingId) {
    const row = findRow(existingId, realm);
    if (row && !isIdleExpired(row, now)) {
      db.update(sessions)
        .set({ lastSeenAt: new Date(now) })
        .where(eq(sessions.id, row.id))
        .run();
      return toAuthSession({ ...row, lastSeenAt: new Date(now) });
    }
    if (row) {
      endSessionRow(row.id);
    }
  }

  const fresh = createAnonymousSessionRow(realm, now);
  await cookie.update({
    authSessions: { ...cookie.data.authSessions, [realm]: fresh.id },
  });
  return toAuthSession(fresh);
}

/** `null` when the row is missing or idle-expired (and, in the latter case, deletes it). */
export async function findAuthSessionById(id: string, realm: Realm): Promise<AuthSession | null> {
  const row = findRow(id, realm);
  if (!row) {
    return null;
  }
  if (isIdleExpired(row, Date.now())) {
    endSessionRow(row.id);
    return null;
  }
  return toAuthSession(row);
}

export async function updateAuthSession(
  event: H3Event,
  realm: Realm,
  patch: Partial<Pick<AuthSession, "userId" | "signedOn" | "originalUrl">>,
): Promise<AuthSession> {
  const current = await getAuthSession(event, realm);
  db.update(sessions).set(patch).where(eq(sessions.id, current.id)).run();
  return { ...current, ...patch };
}

/** Deletes the row and its cart lines, and forgets its id in the cookie. */
export async function endAuthSession(event: H3Event, realm: Realm): Promise<void> {
  const cookie = await authCookie(event);
  const existingId = cookie.data.authSessions?.[realm];
  if (existingId) {
    endSessionRow(existingId);
  }

  const authSessions = { ...cookie.data.authSessions };
  delete authSessions[realm];
  await cookie.update({ authSessions });
}
