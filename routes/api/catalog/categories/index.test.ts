import { H3Event } from "nitro/h3";
import { describe, expect, it, vi } from "vitest";

import { CatalogError } from "../../../../lib/catalog/errors";
import * as queries from "../../../../lib/catalog/queries";
import getCategoriesRoute from "./index.get";

/**
 * INTEGRATION TEST
 *
 * Same direct-H3Event pattern as routes/api/catalog/products/[productId].test.ts.
 */
function eventFor(url: string, locale?: string): H3Event {
  return new H3Event(new Request(url), locale ? { locale } : {});
}

describe("GET /api/catalog/categories", () => {
  it("[AC-1] returns every category with no sign-on requested (anonymous)", async () => {
    const event = eventFor("http://localhost/api/catalog/categories", "en_US");

    const result = await getCategoriesRoute(event);

    expect(result.categories.length).toBeGreaterThanOrEqual(5);
    expect(result.categories.map((c: { categoryId: string }) => c.categoryId)).toContain("DOGS");
  });

  it("uses the ?locale= query over the session locale when it parses", async () => {
    const event = eventFor("http://localhost/api/catalog/categories?locale=ja_JP", "en_US");

    const result = await getCategoriesRoute(event);

    expect(result.categories[0]).toMatchObject({ locale: "ja_JP" });
  });

  it("[SWHR-C-0175] responds 503 with CATALOG_ERROR and no categories when the store is unreachable", () => {
    const spy = vi.spyOn(queries, "listCategories").mockImplementation(() => {
      throw new CatalogError("connection refused");
    });

    const event = eventFor("http://localhost/api/catalog/categories", "en_US");

    try {
      getCategoriesRoute(event);
      expect.fail("expected getCategoriesRoute to throw");
    } catch (error) {
      expect(error).toMatchObject({
        status: 503,
        data: { code: "CATALOG_ERROR", message: "connection refused" },
      });
      expect((error as { data?: { categories?: unknown } }).data?.categories).toBeUndefined();
    } finally {
      spy.mockRestore();
    }
  });
});
