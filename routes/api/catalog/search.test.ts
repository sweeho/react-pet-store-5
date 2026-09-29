import { H3Event } from "nitro/h3";
import { describe, expect, it, vi } from "vitest";

import { CatalogError } from "../../../lib/catalog/errors";
import * as queries from "../../../lib/catalog/queries";
import getSearchRoute from "./search.get";

function eventFor(url: string, locale?: string): H3Event {
  return new H3Event(new Request(url), locale ? { locale } : {});
}

describe("GET /api/catalog/search", () => {
  it("[AC-1] returns matching items and the parsed keywords, anonymously", async () => {
    const event = eventFor("http://localhost/api/catalog/search?keywords=dog", "en_US");

    const result = await getSearchRoute(event);

    expect(result.keywords).toEqual(["dog"]);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.paging).toMatchObject({ start: 0, count: 2 });
  });

  it("a blank query answers an empty page without an error", async () => {
    const event = eventFor("http://localhost/api/catalog/search", "en_US");

    const result = await getSearchRoute(event);

    expect(result.keywords).toEqual([]);
    expect(result.items).toEqual([]);
  });

  it("responds 400 when count is not a positive integer", () => {
    const event = eventFor("http://localhost/api/catalog/search?keywords=dog&count=0", "en_US");

    try {
      getSearchRoute(event);
      expect.fail("expected getSearchRoute to throw");
    } catch (error) {
      expect(error).toMatchObject({ status: 400 });
    }
  });

  it("responds 400 when start is not an integer", () => {
    const event = eventFor("http://localhost/api/catalog/search?keywords=dog&start=abc", "en_US");

    try {
      getSearchRoute(event);
      expect.fail("expected getSearchRoute to throw");
    } catch (error) {
      expect(error).toMatchObject({ status: 400 });
    }
  });

  it("a negative start is a valid request that returns an empty page", async () => {
    const event = eventFor("http://localhost/api/catalog/search?keywords=dog&start=-5", "en_US");

    const result = await getSearchRoute(event);

    expect(result.items).toEqual([]);
  });

  it("[AC-4] responds 503 with CATALOG_ERROR and no partial body when the store is unreachable", () => {
    const spy = vi.spyOn(queries, "searchItems").mockImplementation(() => {
      throw new CatalogError("connection refused");
    });

    const event = eventFor("http://localhost/api/catalog/search?keywords=dog", "en_US");

    try {
      getSearchRoute(event);
      expect.fail("expected getSearchRoute to throw");
    } catch (error) {
      expect(error).toMatchObject({
        status: 503,
        data: { code: "CATALOG_ERROR", message: "connection refused" },
      });
      expect((error as { data?: { items?: unknown } }).data?.items).toBeUndefined();
    } finally {
      spy.mockRestore();
    }
  });
});
