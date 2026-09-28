import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { getDefaultLocale } from "./model";
import { getCartLocale, getSessionLocale, setSessionLocale } from "./session";

/**
 * INTEGRATION TEST
 *
 * Exercises lib/locale/session.ts against real H3 events and a real
 * (sealed-cookie) session, the way middleware/locale.ts and the /api/locale
 * routes use it. `nextRequest` carries the Set-Cookie header h3 wrote on one
 * event into the Cookie header of the next, so two H3Event instances behave
 * like two requests from the same visitor.
 */
function nextRequest(event: H3Event, url = "http://localhost/"): Request {
  const cookie = event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
  return new Request(url, cookie ? { headers: { cookie } } : undefined);
}

describe("getSessionLocale", () => {
  it("[AC-1] assigns the default locale to a session that has none", async () => {
    const event = new H3Event(new Request("http://localhost/"));

    await expect(getSessionLocale(event)).resolves.toBe(getDefaultLocale());
  });

  it("[AC-2] preserves an existing session locale across requests", async () => {
    const first = new H3Event(new Request("http://localhost/"));
    await setSessionLocale(first, "ja_JP");

    const second = new H3Event(nextRequest(first));

    await expect(getSessionLocale(second)).resolves.toBe("ja_JP");
  });

  it("throws when SESSION_PASSWORD is unset in production", async () => {
    const originalPassword = process.env.SESSION_PASSWORD;
    const originalNodeEnv = process.env.NODE_ENV;
    delete process.env.SESSION_PASSWORD;
    process.env.NODE_ENV = "production";

    try {
      const event = new H3Event(new Request("http://localhost/"));
      await expect(getSessionLocale(event)).rejects.toThrow(
        "SESSION_PASSWORD must be set in production",
      );
    } finally {
      if (originalPassword === undefined) {
        delete process.env.SESSION_PASSWORD;
      } else {
        process.env.SESSION_PASSWORD = originalPassword;
      }
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});

describe("setSessionLocale / getCartLocale", () => {
  it("defaults the cart locale when unset", async () => {
    const event = new H3Event(new Request("http://localhost/"));

    await expect(getCartLocale(event)).resolves.toBe(getDefaultLocale());
  });

  it("moves the cart locale together with the session locale", async () => {
    const event = new H3Event(new Request("http://localhost/"));

    await setSessionLocale(event, "zh_CN");

    await expect(getCartLocale(event)).resolves.toBe("zh_CN");
  });
});
