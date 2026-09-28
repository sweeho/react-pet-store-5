import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { setSessionLocale } from "../locale/session";
import { getCartItemDetails } from "./cart";

/**
 * INTEGRATION TEST
 *
 * Real H3Event + real (in-memory) session and catalog, same pattern as
 * lib/locale/session.test.ts. Cart item lookups go through the CART locale
 * (P5, SWHR-R-0016), not the request's session locale — this is what makes
 * the default-en_US behaviour worth testing on its own.
 */
describe("getCartItemDetails", () => {
  it("[AC-6] uses the en_US catalog details for a cart whose locale has never been set", async () => {
    const event = new H3Event(new Request("http://localhost/"));

    const items = await getCartItemDetails(event, ["EST-6"]);

    expect(items).toEqual([
      expect.objectContaining({ name: "Male Adult Bulldog", locale: "en_US" }),
    ]);
  });

  it("uses the cart's locale once it has been set by a switch", async () => {
    const event = new H3Event(new Request("http://localhost/"));

    await setSessionLocale(event, "ja_JP");

    const items = await getCartItemDetails(event, ["EST-6"]);

    expect(items).toEqual([
      expect.objectContaining({ name: "オス成犬ブルドッグ", locale: "ja_JP" }),
    ]);
  });

  it("omits an item id that has no details in the cart's locale", async () => {
    const event = new H3Event(new Request("http://localhost/"));

    const items = await getCartItemDetails(event, ["EST-6", "NOPE"]);

    expect(items.map((item) => item.itemId)).toEqual(["EST-6"]);
  });
});
