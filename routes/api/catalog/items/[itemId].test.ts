import { H3Event } from "nitro/h3";
import { describe, expect, it, vi } from "vitest";

import { CatalogError } from "../../../../lib/catalog/errors";
import * as queries from "../../../../lib/catalog/queries";
import getItemRoute from "./[itemId].get";

function eventFor(itemId: string, url: string, locale?: string): H3Event {
  return new H3Event(new Request(url), {
    params: { itemId },
    ...(locale ? { locale } : {}),
  });
}

describe("GET /api/catalog/items/:itemId", () => {
  it("[AC-1] returns the item anonymously", async () => {
    const event = eventFor("EST-6", "http://localhost/api/catalog/items/EST-6", "en_US");

    const result = await getItemRoute(event);

    expect(result.item).toMatchObject({
      itemId: "EST-6",
      name: "Male Adult Bulldog",
      locale: "en_US",
    });
  });

  it("a parseable ?locale= query overrides the session locale", async () => {
    const event = eventFor(
      "EST-6",
      "http://localhost/api/catalog/items/EST-6?locale=ja_JP",
      "en_US",
    );

    const result = await getItemRoute(event);

    expect(result.item).toMatchObject({ locale: "ja_JP" });
  });

  it("[AC-3] responds 404 for an item with no details in the requested locale", () => {
    // K9-DL-01 has no ja_JP product details, so EST-9 is not visible in ja_JP
    // even though the item row itself carries ja_JP details.
    const event = eventFor("EST-9", "http://localhost/api/catalog/items/EST-9", "ja_JP");

    try {
      getItemRoute(event);
      expect.fail("expected getItemRoute to throw");
    } catch (error) {
      expect(error).toMatchObject({ status: 404 });
    }
  });

  it("responds 404 for an item id that doesn't exist", () => {
    const event = eventFor("NOPE", "http://localhost/api/catalog/items/NOPE", "en_US");

    try {
      getItemRoute(event);
      expect.fail("expected getItemRoute to throw");
    } catch (error) {
      expect(error).toMatchObject({ status: 404 });
    }
  });

  it("[AC-4] responds 503 with CATALOG_ERROR and no partial body when the store is unreachable", () => {
    const spy = vi.spyOn(queries, "getItem").mockImplementation(() => {
      throw new CatalogError("connection refused");
    });

    const event = eventFor("EST-6", "http://localhost/api/catalog/items/EST-6", "en_US");

    try {
      getItemRoute(event);
      expect.fail("expected getItemRoute to throw");
    } catch (error) {
      expect(error).toMatchObject({
        status: 503,
        data: { code: "CATALOG_ERROR", message: "connection refused" },
      });
      expect((error as { data?: { item?: unknown } }).data?.item).toBeUndefined();
    } finally {
      spy.mockRestore();
    }
  });
});
