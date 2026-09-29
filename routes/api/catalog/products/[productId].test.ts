import { H3Event } from "nitro/h3";
import { describe, expect, it, vi } from "vitest";

import { CatalogError } from "../../../../lib/catalog/errors";
import * as queries from "../../../../lib/catalog/queries";
import getProductRoute from "./[productId].get";

/**
 * INTEGRATION TEST
 *
 * Same direct-H3Event pattern as routes/api/users/[id].test.ts: build the
 * event with `context.params` set (Nitro's router does this normally) and,
 * where the case needs a specific effective locale, `context.locale` set
 * the way middleware/locale.ts would have.
 */
function eventFor(productId: string, url: string, locale?: string): H3Event {
  return new H3Event(new Request(url), {
    params: { productId },
    ...(locale ? { locale } : {}),
  });
}

describe("GET /api/catalog/products/:productId", () => {
  it("[AC-2] returns Japanese name, description, image and price when context.locale is ja_JP", async () => {
    const event = eventFor("K9-BD-01", "http://localhost/api/catalog/products/K9-BD-01", "ja_JP");

    const result = await getProductRoute(event);

    expect(result.product).toMatchObject({ name: "ブルドッグ", locale: "ja_JP" });
    expect(result.items.map((item: { itemId: string }) => item.itemId).sort()).toEqual([
      "EST-6",
      "EST-7",
    ]);
    expect(result.items[0]).toMatchObject({ image: "dogs.svg" });
    expect(result.paging).toMatchObject({ start: 0, count: 2, hasNext: false });
  });

  it("a parseable ?locale= query overrides the session locale for this request", async () => {
    const event = eventFor(
      "K9-BD-01",
      "http://localhost/api/catalog/products/K9-BD-01?locale=zh_CN",
      "en_US",
    );

    const result = await getProductRoute(event);

    expect(result.product).toMatchObject({ name: "斗牛犬", locale: "zh_CN" });
  });

  it("an unparseable ?locale= query is ignored, falling back to the session locale", async () => {
    const event = eventFor(
      "K9-BD-01",
      "http://localhost/api/catalog/products/K9-BD-01?locale=ja",
      "ja_JP",
    );

    const result = await getProductRoute(event);

    expect(result.product.locale).toBe("ja_JP");
  });

  it("[AC-3] responds 404 for a product with no details in the requested locale", () => {
    const event = eventFor("K9-PO-02", "http://localhost/api/catalog/products/K9-PO-02", "zh_CN");

    try {
      getProductRoute(event);
      expect.fail("expected getProductRoute to throw");
    } catch (error) {
      expect(error).toMatchObject({ status: 404 });
    }
  });

  it("responds 404 for a product id that doesn't exist", () => {
    const event = eventFor("NOPE", "http://localhost/api/catalog/products/NOPE", "en_US");

    try {
      getProductRoute(event);
      expect.fail("expected getProductRoute to throw");
    } catch (error) {
      expect(error).toMatchObject({ status: 404 });
    }
  });

  it("responds 400 when count is not a positive integer", () => {
    const event = eventFor(
      "K9-BD-01",
      "http://localhost/api/catalog/products/K9-BD-01?count=0",
      "en_US",
    );

    try {
      getProductRoute(event);
      expect.fail("expected getProductRoute to throw");
    } catch (error) {
      expect(error).toMatchObject({ status: 400 });
    }
  });

  it("responds 400 when start is not an integer", () => {
    const event = eventFor(
      "K9-BD-01",
      "http://localhost/api/catalog/products/K9-BD-01?start=abc",
      "en_US",
    );

    try {
      getProductRoute(event);
      expect.fail("expected getProductRoute to throw");
    } catch (error) {
      expect(error).toMatchObject({ status: 400 });
    }
  });

  it("[AC-4] responds 503 with CATALOG_ERROR and no partial body when the store is unreachable", () => {
    const spy = vi.spyOn(queries, "getProduct").mockImplementation(() => {
      throw new CatalogError("connection refused");
    });

    const event = eventFor("K9-BD-01", "http://localhost/api/catalog/products/K9-BD-01", "en_US");

    try {
      getProductRoute(event);
      expect.fail("expected getProductRoute to throw");
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
