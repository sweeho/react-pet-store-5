import { H3Event } from "nitro/h3";
import { describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import { users } from "../db/schema";
import { getAuthSession, IDLE_TIMEOUT_MS, updateAuthSession } from "../lib/auth/session";
import signonMiddleware from "./signon";

// sessions.userId references users.userId (FK now enforced). Several cases
// below sign "alice" on with no cleanup between them, so this must tolerate
// being called more than once.
function ensureUser(userId: string): void {
  db.insert(users).values({ userId, passwordHash: "test-hash" }).onConflictDoNothing().run();
}

/**
 * INTEGRATION TEST
 *
 * Exercises middleware/signon.ts the way Nitro actually runs it: a real
 * H3Event through the real gate (lib/auth/protection.ts + lib/auth/
 * session.ts), against the real configs/signon-config.json. `nextRequest`
 * carries the Set-Cookie header one event wrote into the next event's
 * Cookie header, so a sequence of H3Event instances behaves like a
 * sequence of requests from the same visitor (mirrors routes/api/
 * locale.test.ts and lib/auth/session.test.ts).
 */
function nextRequest(event: H3Event, url: string): Request {
  const cookie = event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
  return new Request(url, cookie ? { headers: { cookie } } : undefined);
}

function newEvent(path: string, previous?: H3Event): H3Event {
  const url = `http://localhost${path}`;
  return new H3Event(previous ? nextRequest(previous, url) : new Request(url));
}

describe("signon middleware", () => {
  it("[SWHR-C-0121] gates an anonymous request for the checkout entry page", async () => {
    const event = newEvent("/checkout");

    const result = await signonMiddleware(event);

    expect(result).toMatchObject({ status: 302 });
    expect(result?.headers.get("location")).toBe("/signin");
  });

  it("[SWHR-C-0122] serves the cart page to an anonymous shopper with no gate", async () => {
    const event = newEvent("/cart");

    await expect(signonMiddleware(event)).resolves.toBeUndefined();
  });

  it("[SWHR-C-0123] serves a protected page directly to a signed-on session", async () => {
    const first = newEvent("/");
    ensureUser("alice");
    await updateAuthSession(first, "storefront", { userId: "alice", signedOn: true });

    const second = newEvent("/account", first);
    await expect(signonMiddleware(second)).resolves.toBeUndefined();
  });

  it("[SWHR-C-0124] records the gated page as the return target for an anonymous session", async () => {
    const first = newEvent("/account");

    await signonMiddleware(first);

    const second = newEvent("/", first);
    const session = await getAuthSession(second, "storefront");
    expect(session.originalUrl).toBe("/account");
  });

  it("[SWHR-C-0125] gates the account page even with a query string appended", async () => {
    const event = newEvent("/account?tab=orders");

    const result = await signonMiddleware(event);

    expect(result).toMatchObject({ status: 302 });
  });

  it("[SWHR-C-0126] does not gate a path that only starts with a protected page's name", async () => {
    const event = newEvent("/accountinfo");

    await expect(signonMiddleware(event)).resolves.toBeUndefined();
  });

  it("never touches /api requests", async () => {
    const event = newEvent("/api/session");

    await expect(signonMiddleware(event)).resolves.toBeUndefined();
  });

  it("never touches an asset request", async () => {
    const event = newEvent("/assets/app.js");

    await expect(signonMiddleware(event)).resolves.toBeUndefined();
  });

  describe("idle timeout (SWHR-R-0074)", () => {
    it("[SWHR-C-0136] ends a session idle beyond 15 minutes and shows sign-in", async () => {
      vi.useFakeTimers();
      try {
        vi.setSystemTime(0);
        const first = newEvent("/");
        ensureUser("alice");
        await updateAuthSession(first, "storefront", { userId: "alice", signedOn: true });

        vi.setSystemTime(IDLE_TIMEOUT_MS.storefront + 60_000);
        const second = newEvent("/account", first);
        const result = await signonMiddleware(second);

        expect(result).toMatchObject({ status: 302 });
        expect(result?.headers.get("location")).toBe("/signin");

        const third = newEvent("/", second);
        const session = await getAuthSession(third, "storefront");
        expect(session.signedOn).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    it("[SWHR-C-0137] keeps a session signed on when idle for 14 minutes", async () => {
      vi.useFakeTimers();
      try {
        vi.setSystemTime(0);
        const first = newEvent("/");
        ensureUser("alice");
        await updateAuthSession(first, "storefront", { userId: "alice", signedOn: true });

        vi.setSystemTime(IDLE_TIMEOUT_MS.storefront - 60_000);
        const second = newEvent("/account", first);

        await expect(signonMiddleware(second)).resolves.toBeUndefined();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
