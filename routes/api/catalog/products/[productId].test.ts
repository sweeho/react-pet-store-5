import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

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
});
