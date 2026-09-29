import { H3Event } from "nitro/h3";
import { describe, expect, it, vi } from "vitest";

import { db } from "../../db/client";
import { users } from "../../db/schema";
import { addCartItem, listCartLines } from "../cart/lines";
import {
  IDLE_TIMEOUT_MS,
  endAuthSession,
  findAuthSessionById,
  getAuthSession,
  updateAuthSession,
} from "./session";

/**
 * INTEGRATION TEST
 *
 * Exercises lib/auth/session.ts against real H3 events and the real sealed
 * cookie (mirrors lib/locale/session.test.ts's pattern), and the real
 * sessions/cartLines tables. `nextRequest` carries the Set-Cookie header
 * one event wrote into the next event's Cookie header, so a sequence of
 * H3Event instances behaves like a sequence of requests from one visitor.
 */
function nextRequest(event: H3Event, url = "http://localhost/"): Request {
  const cookie = event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
  return new Request(url, cookie ? { headers: { cookie } } : undefined);
}

function newEvent(previous?: H3Event): H3Event {
  return new H3Event(previous ? nextRequest(previous) : new Request("http://localhost/"));
}

// sessions.userId references users.userId (FK now enforced). Several cases
// below sign "alice" on with no cleanup between them, so this must tolerate
// being called more than once.
function ensureUser(userId: string): void {
  db.insert(users).values({ userId, passwordHash: "test-hash" }).onConflictDoNothing().run();
}

describe("getAuthSession", () => {
  it("creates a fresh anonymous session on first use", async () => {
    const event = newEvent();

    const session = await getAuthSession(event, "storefront");

    expect(session).toMatchObject({
      realm: "storefront",
      userId: null,
      signedOn: false,
      originalUrl: null,
    });
    expect(session.id).toBeTruthy();
  });

  it("returns the same session id across requests", async () => {
    const first = newEvent();
    const initial = await getAuthSession(first, "storefront");

    const second = newEvent(first);
    const again = await getAuthSession(second, "storefront");

    expect(again.id).toBe(initial.id);
  });

  it("keeps storefront and admin sessions independent", async () => {
    const event = newEvent();

    const storefront = await getAuthSession(event, "storefront");
    const admin = await getAuthSession(event, "admin");

    expect(admin.id).not.toBe(storefront.id);
    expect(admin.realm).toBe("admin");
  });

  it("replaces an idle-expired session with a fresh anonymous one", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(0);
      const first = newEvent();
      const initial = await getAuthSession(first, "storefront");
      ensureUser("alice");
      await updateAuthSession(first, "storefront", { userId: "alice", signedOn: true });

      vi.setSystemTime(IDLE_TIMEOUT_MS.storefront + 60_000);
      const second = newEvent(first);
      const afterIdle = await getAuthSession(second, "storefront");

      expect(afterIdle.id).not.toBe(initial.id);
      expect(afterIdle.signedOn).toBe(false);
      expect(afterIdle.userId).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps a session that is idle for less than the timeout", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(0);
      const first = newEvent();
      const initial = await getAuthSession(first, "storefront");

      vi.setSystemTime(IDLE_TIMEOUT_MS.storefront - 60_000);
      const second = newEvent(first);
      const stillAlive = await getAuthSession(second, "storefront");

      expect(stillAlive.id).toBe(initial.id);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("findAuthSessionById", () => {
  it("returns null for an id that was never created", async () => {
    await expect(findAuthSessionById("does-not-exist", "storefront")).resolves.toBeNull();
  });

  it("finds a live session by id", async () => {
    const event = newEvent();
    const session = await getAuthSession(event, "storefront");

    await expect(findAuthSessionById(session.id, "storefront")).resolves.toMatchObject({
      id: session.id,
    });
  });

  it("returns null and deletes an idle-expired session", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(0);
      const event = newEvent();
      const session = await getAuthSession(event, "storefront");

      vi.setSystemTime(IDLE_TIMEOUT_MS.storefront + 60_000);
      await expect(findAuthSessionById(session.id, "storefront")).resolves.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("updateAuthSession", () => {
  it("persists the patch across requests", async () => {
    const first = newEvent();
    ensureUser("alice");
    await updateAuthSession(first, "storefront", {
      userId: "alice",
      signedOn: true,
      originalUrl: "/account",
    });

    const second = newEvent(first);
    const session = await getAuthSession(second, "storefront");

    expect(session).toMatchObject({ userId: "alice", signedOn: true, originalUrl: "/account" });
  });
});

describe("endAuthSession", () => {
  it("deletes the session row and its cart lines, and a later request gets a fresh session", async () => {
    const first = newEvent();
    const original = await getAuthSession(first, "storefront");
    addCartItem(original.id, "EST-6");

    await endAuthSession(first, "storefront");

    expect(listCartLines(original.id)).toEqual([]);

    const second = newEvent(first);
    const fresh = await getAuthSession(second, "storefront");
    expect(fresh.id).not.toBe(original.id);
    expect(fresh.signedOn).toBe(false);
  });
});
