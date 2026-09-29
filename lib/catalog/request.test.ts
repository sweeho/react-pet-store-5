import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { CatalogError } from "./errors";
import { resolveLocale, resolvePaging, withCatalogErrorHandling } from "./request";

function eventFor(url: string, locale?: string): H3Event {
  return new H3Event(new Request(url), locale ? { locale } : {});
}

describe("resolveLocale", () => {
  it("uses the session locale from event.context when no ?locale= is given", () => {
    const event = eventFor("http://localhost/api/catalog/categories", "en_US");

    expect(resolveLocale(event)).toBe("en_US");
  });

  it("prefers a parseable ?locale= query over the session locale", () => {
    const event = eventFor("http://localhost/api/catalog/categories?locale=ja_JP", "en_US");

    expect(resolveLocale(event)).toBe("ja_JP");
  });

  it("falls back to the session locale when ?locale= does not parse", () => {
    const event = eventFor("http://localhost/api/catalog/categories?locale=ja", "ja_JP");

    expect(resolveLocale(event)).toBe("ja_JP");
  });
});

describe("resolvePaging", () => {
  it("[AC-2] defaults to start 0 and the default page size when neither is given", () => {
    const event = eventFor("http://localhost/api/catalog/categories/DOGS");

    expect(resolvePaging(event)).toEqual({ start: 0, count: 2 });
  });

  it("parses valid integer start and count", () => {
    const event = eventFor("http://localhost/api/catalog/categories/DOGS?start=4&count=10");

    expect(resolvePaging(event)).toEqual({ start: 4, count: 10 });
  });

  it("[AC-2] accepts a negative start as a valid request", () => {
    const event = eventFor("http://localhost/api/catalog/categories/DOGS?start=-5");

    expect(resolvePaging(event)).toEqual({ start: -5, count: 2 });
  });

  it("[AC-2] throws a 400 when start is not an integer", () => {
    const event = eventFor("http://localhost/api/catalog/categories/DOGS?start=abc");

    expect(() => resolvePaging(event)).toThrowError(
      expect.objectContaining({ status: 400 }) as Error,
    );
  });

  it("[AC-2] throws a 400 when count is not an integer", () => {
    const event = eventFor("http://localhost/api/catalog/categories/DOGS?count=1.5");

    expect(() => resolvePaging(event)).toThrowError(
      expect.objectContaining({ status: 400 }) as Error,
    );
  });

  it("[AC-2] throws a 400 when count is zero", () => {
    const event = eventFor("http://localhost/api/catalog/categories/DOGS?count=0");

    expect(() => resolvePaging(event)).toThrowError(
      expect.objectContaining({ status: 400 }) as Error,
    );
  });

  it("[AC-2] throws a 400 when count is negative", () => {
    const event = eventFor("http://localhost/api/catalog/categories/DOGS?count=-1");

    expect(() => resolvePaging(event)).toThrowError(
      expect.objectContaining({ status: 400 }) as Error,
    );
  });
});

describe("withCatalogErrorHandling", () => {
  it("returns the callback's value when it does not throw", () => {
    expect(withCatalogErrorHandling(() => ({ categories: [] }))).toEqual({ categories: [] });
  });

  it("[AC-4] maps a CatalogError to a 503 carrying CATALOG_ERROR and the underlying message", () => {
    expect(() =>
      withCatalogErrorHandling(() => {
        throw new CatalogError("connection refused");
      }),
    ).toThrowError(
      expect.objectContaining({
        status: 503,
        data: { code: "CATALOG_ERROR", message: "connection refused" },
      }) as Error,
    );
  });

  it("passes through any other error unchanged", () => {
    const notFound = new Error("not found");

    expect(() =>
      withCatalogErrorHandling(() => {
        throw notFound;
      }),
    ).toThrow(notFound);
  });
});
