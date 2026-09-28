import { describe, expect, it } from "vitest";

import { getItem, getProduct, listProductItems } from "./queries";

/**
 * INTEGRATION TEST
 *
 * Runs against the real (in-memory under Vitest, see db/client.ts)
 * database, seeded by db/seed/catalog.ts. Every case here exercises the
 * "no cross-locale fallback" rule (D4, SWHR-R-0014) against seeded rows
 * built specifically to exercise it — see db/seed/catalog.ts's comments on
 * POODLE (missing ja_JP and zh_CN entirely) and DALMATIAN/EST-9 (item has
 * ja_JP details, product does not).
 */
describe("getProduct", () => {
  it("[AC-2] returns the Japanese name, description and image for an item shown in ja_JP", () => {
    const productView = getProduct("BULLDOG", "ja_JP");

    expect(productView).toMatchObject({
      productId: "BULLDOG",
      name: "ブルドッグ",
      locale: "ja_JP",
    });
  });

  it("returns the en_US details for the same product", () => {
    expect(getProduct("BULLDOG", "en_US")).toMatchObject({ name: "Bulldog", locale: "en_US" });
  });

  it("[AC-3] reports not found for a product whose details exist only in en_US, requested in zh_CN", () => {
    expect(getProduct("POODLE", "zh_CN")).toBeNull();
  });

  it("reports not found for that same product requested in ja_JP", () => {
    expect(getProduct("POODLE", "ja_JP")).toBeNull();
  });

  it("returns the product when requested in the one locale it does have (en_US)", () => {
    expect(getProduct("POODLE", "en_US")).toMatchObject({ name: "Poodle" });
  });

  it("returns null for a product id that doesn't exist at all", () => {
    expect(getProduct("NOPE", "en_US")).toBeNull();
  });
});

describe("listProductItems", () => {
  it("[AC-2] returns Japanese item details for BULLDOG in ja_JP", () => {
    const items = listProductItems("BULLDOG", "ja_JP");

    expect(items.map((i) => i.itemId).sort()).toEqual(["EST-6", "EST-7"]);
    const est6 = items.find((i) => i.itemId === "EST-6");
    expect(est6).toMatchObject({ name: "オス成犬ブルドッグ", locale: "ja_JP" });
  });

  it("[AC-4] excludes an item whose product lacks the requested locale, even though the item has its own row", () => {
    // EST-9 (DALMATIAN) has ja_JP item details, but DALMATIAN has no ja_JP
    // product details — SWHR-R-0014.03.
    expect(listProductItems("DALMATIAN", "ja_JP")).toEqual([]);
  });

  it("includes that same item when both product and item have details (zh_CN)", () => {
    const items = listProductItems("DALMATIAN", "zh_CN");
    expect(items.map((i) => i.itemId)).toEqual(["EST-9"]);
  });

  it("returns an empty list for a product with no items in a locale it does have", () => {
    expect(listProductItems("POODLE", "zh_CN")).toEqual([]);
  });
});

describe("getItem", () => {
  it("[AC-5] en_US list price is 1850 minor units (18.50) and ja_JP is 2000 (2000 yen, no conversion)", () => {
    expect(getItem("EST-6", "en_US")).toMatchObject({ listPrice: 1850, locale: "en_US" });
    expect(getItem("EST-6", "ja_JP")).toMatchObject({ listPrice: 2000, locale: "ja_JP" });
  });

  it("[AC-4] returns null for an item whose product lacks the requested locale", () => {
    expect(getItem("EST-9", "ja_JP")).toBeNull();
  });

  it("returns the item when its product has that locale too", () => {
    expect(getItem("EST-9", "zh_CN")).toMatchObject({ name: "成年斑点狗" });
  });

  it("returns null for an item id that doesn't exist", () => {
    expect(getItem("NOPE", "en_US")).toBeNull();
  });
});
