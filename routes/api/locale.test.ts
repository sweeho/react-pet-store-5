import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { getDefaultLocale } from "../../lib/locale/model";
import localeMiddleware from "../../middleware/locale";
import getLocale from "./locale.get";
import postLocale from "./locale.post";

/**
 * INTEGRATION TEST
 *
 * Exercises middleware/locale.ts and the /api/locale routes together the
 * way Nitro actually runs them, following the pattern in
 * routes/api/hello.test.ts: build a real H3Event, run the middleware, then
 * the route handler. `cookieOf` carries the Set-Cookie header one event
 * wrote into the next event's Cookie header, so a sequence of H3Event
 * instances behaves like a sequence of requests from the same visitor.
 */
function cookieOf(event: H3Event): string {
  return event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
}

function request(method: "GET" | "POST", cookie?: string, body?: unknown): Request {
  const headers: Record<string, string> = {};
  if (cookie) {
    headers.cookie = cookie;
  }
  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }
  return new Request("http://localhost/api/locale", {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("GET /api/locale", () => {
  it("[AC-1] assigns and returns the default locale for a new visitor", async () => {
    const event = new H3Event(request("GET"));
    await localeMiddleware(event);

    await expect(getLocale(event)).resolves.toEqual({
      locale: getDefaultLocale(),
      cartLocale: getDefaultLocale(),
    });
  });

  it("[AC-2] preserves an existing session locale on a later request", async () => {
    const change = new H3Event(request("POST", undefined, { locale: "ja_JP" }));
    await localeMiddleware(change);
    await postLocale(change);

    const later = new H3Event(request("GET", cookieOf(change)));
    await localeMiddleware(later);

    await expect(getLocale(later)).resolves.toEqual({ locale: "ja_JP", cartLocale: "ja_JP" });
  });
});

describe("POST /api/locale", () => {
  it("[AC-3] rejects an unparseable locale and leaves the session unchanged", async () => {
    const first = new H3Event(request("GET"));
    await localeMiddleware(first);
    const sessionCookie = cookieOf(first);

    const rejected = new H3Event(request("POST", sessionCookie, { locale: "ja" }));
    await localeMiddleware(rejected);

    await expect(postLocale(rejected)).rejects.toMatchObject({
      status: 400,
      message: "Unable to change language to ja",
    });

    const later = new H3Event(request("GET", sessionCookie));
    await localeMiddleware(later);

    await expect(getLocale(later)).resolves.toEqual({
      locale: getDefaultLocale(),
      cartLocale: getDefaultLocale(),
    });
  });

  it("[AC-4] a later business operation reads the locale after a switch", async () => {
    const change = new H3Event(request("POST", undefined, { locale: "zh_CN" }));
    await localeMiddleware(change);

    await expect(postLocale(change)).resolves.toEqual({ locale: "zh_CN" });

    const businessOperation = new H3Event(request("GET", cookieOf(change)));
    await localeMiddleware(businessOperation);

    expect(businessOperation.context.locale).toBe("zh_CN");
  });
});
