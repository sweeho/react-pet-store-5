import { H3Event } from "nitro/h3";
import { describe, expect, it, vi } from "vitest";

import { CatalogError } from "../../../../lib/catalog/errors";
import * as queries from "../../../../lib/catalog/queries";
import getCategoryRoute from "./[categoryId].get";

function eventFor(categoryId: string, url: string, locale?: string): H3Event {
  return new H3Event(new Request(url), {
    params: { categoryId },
    ...(locale ? { locale } : {}),
  });
}

describe("GET /api/catalog/categories/:categoryId", () => {
  it("[AC-1] returns the category, its products and a paging block, anonymously", async () => {
    const event = eventFor("DOGS", "http://localhost/api/catalog/categories/DOGS", "en_US");

    const result = await getCategoryRoute(event);

    expect(result.category).toMatchObject({ categoryId: "DOGS", locale: "en_US" });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.paging).toMatchObject({ start: 0, count: 2 });
  });

  it("[AC-3] answers 200 with category: null and an empty page for an unknown category, not a 404", async () => {
    const event = eventFor("NOPE", "http://localhost/api/catalog/categories/NOPE", "en_US");

    const result = await getCategoryRoute(event);

    expect(result.category).toBeNull();
    expect(result.items).toEqual([]);
    expect(result.paging).toMatchObject({ hasNext: false, hasPrevious: false });
  });

  it("responds 400 when count is not a positive integer", () => {
    const event = eventFor("DOGS", "http://localhost/api/catalog/categories/DOGS?count=0", "en_US");

    try {
      getCategoryRoute(event);
      expect.fail("expected getCategoryRoute to throw");
    } catch (error) {
      expect(error).toMatchObject({ status: 400 });
    }
  });

  it("responds 400 when start is not an integer", () => {
    const event = eventFor(
      "DOGS",
      "http://localhost/api/catalog/categories/DOGS?start=abc",
      "en_US",
    );

    try {
      getCategoryRoute(event);
      expect.fail("expected getCategoryRoute to throw");
    } catch (error) {
      expect(error).toMatchObject({ status: 400 });
    }
  });

  it("a negative start is a valid request that returns an empty page", async () => {
    const event = eventFor(
      "DOGS",
      "http://localhost/api/catalog/categories/DOGS?start=-5",
      "en_US",
    );

    const result = await getCategoryRoute(event);

    expect(result.items).toEqual([]);
    expect(result.paging).toMatchObject({ start: -5, hasNext: false, hasPrevious: false });
  });

  it("[AC-4] responds 503 with CATALOG_ERROR and no partial body when the store is unreachable", () => {
    const spy = vi.spyOn(queries, "getCategory").mockImplementation(() => {
      throw new CatalogError("connection refused");
    });

    const event = eventFor("DOGS", "http://localhost/api/catalog/categories/DOGS", "en_US");

    try {
      getCategoryRoute(event);
      expect.fail("expected getCategoryRoute to throw");
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
