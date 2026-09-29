import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import {
  category,
  categoryDetails,
  item,
  itemDetails,
  product,
  productDetails,
} from "../../db/schema";
import {
  getCategory,
  getItem,
  getProduct,
  listCategories,
  listItems,
  listProductItems,
  listProducts,
  parseKeywords,
  searchItems,
} from "./queries";

/**
 * INTEGRATION TEST
 *
 * Runs against the real (in-memory under Vitest, see db/client.ts)
 * database, seeded by db/seed/catalog.ts. Every case here exercises the
 * "no cross-locale fallback" rule (D4, SWHR-R-0014) against seeded rows
 * built specifically to exercise it — see db/seed/catalog.ts's comments on
 * K9-PO-02/Poodle (missing ja_JP and zh_CN entirely) and K9-DL-01/EST-9
 * (item has ja_JP details, product does not).
 */
describe("getProduct", () => {
  it("[AC-2] returns the Japanese name, description and image for an item shown in ja_JP", () => {
    const productView = getProduct("K9-BD-01", "ja_JP");

    expect(productView).toMatchObject({
      productId: "K9-BD-01",
      name: "ブルドッグ",
      locale: "ja_JP",
    });
  });

  it("returns the en_US details for the same product", () => {
    expect(getProduct("K9-BD-01", "en_US")).toMatchObject({ name: "Bulldog", locale: "en_US" });
  });

  it("[AC-3] reports not found for a product whose details exist only in en_US, requested in zh_CN", () => {
    expect(getProduct("K9-PO-02", "zh_CN")).toBeNull();
  });

  it("reports not found for that same product requested in ja_JP", () => {
    expect(getProduct("K9-PO-02", "ja_JP")).toBeNull();
  });

  it("returns the product when requested in the one locale it does have (en_US)", () => {
    expect(getProduct("K9-PO-02", "en_US")).toMatchObject({ name: "Poodle" });
  });

  it("returns null for a product id that doesn't exist at all", () => {
    expect(getProduct("NOPE", "en_US")).toBeNull();
  });
});

describe("listProductItems", () => {
  it("[AC-2] returns Japanese item details for K9-BD-01 in ja_JP", () => {
    const items = listProductItems("K9-BD-01", "ja_JP");

    expect(items.map((i) => i.itemId).sort()).toEqual(["EST-6", "EST-7"]);
    const est6 = items.find((i) => i.itemId === "EST-6");
    expect(est6).toMatchObject({ name: "オス成犬ブルドッグ", locale: "ja_JP" });
  });

  it("[AC-4] excludes an item whose product lacks the requested locale, even though the item has its own row", () => {
    // EST-9 (K9-DL-01) has ja_JP item details, but K9-DL-01 has no ja_JP
    // product details — SWHR-R-0014.03.
    expect(listProductItems("K9-DL-01", "ja_JP")).toEqual([]);
  });

  it("includes that same item when both product and item have details (zh_CN)", () => {
    const items = listProductItems("K9-DL-01", "zh_CN");
    expect(items.map((i) => i.itemId)).toEqual(["EST-9"]);
  });

  it("returns an empty list for a product with no items in a locale it does have", () => {
    expect(listProductItems("K9-PO-02", "zh_CN")).toEqual([]);
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

  it("[SWHR-C-0161] returns all display fields for EST-6 in en_US", () => {
    expect(getItem("EST-6", "en_US")).toMatchObject({
      itemId: "EST-6",
      productId: "K9-BD-01",
      categoryId: "DOGS",
      productName: "Bulldog",
      name: "Male Adult Bulldog",
      description: "Friendly dog from England.",
      image: "dogs.svg",
      attributes: ["Male Adult", null, null, null, null],
      listPrice: 1850,
      unitCost: 1200,
      locale: "en_US",
    });
  });

  it("[SWHR-C-0162] returns no result for EST-15 in ja_JP, and no error is raised", () => {
    expect(getItem("EST-15", "ja_JP")).toBeNull();
  });
});

describe("getCategory", () => {
  it("[SWHR-C-0148] returns Japanese name and description with category id DOGS in both locales", () => {
    expect(getCategory("DOGS", "ja_JP")).toMatchObject({
      categoryId: "DOGS",
      name: "犬",
      locale: "ja_JP",
    });
    expect(getCategory("DOGS", "en_US")).toMatchObject({ categoryId: "DOGS", name: "Dogs" });
  });

  it("returns null for a category id that doesn't exist", () => {
    expect(getCategory("NOPE", "en_US")).toBeNull();
  });

  it("returns null for a category with no details in the requested locale", () => {
    expect(getCategory("REPTILES", "xx_XX")).toBeNull();
  });
});

describe("listCategories", () => {
  const SEED_CATEGORY_IDS = new Set(["BIRDS", "CATS", "DOGS", "FISH", "REPTILES"]);

  it("[SWHR-C-0157] lists categories alphabetically by en_US name", () => {
    const names = listCategories("en_US")
      .filter((c) => SEED_CATEGORY_IDS.has(c.categoryId))
      .map((c) => c.name);

    expect(names).toEqual(["Birds", "Cats", "Dogs", "Fish", "Reptiles"]);
  });

  it("[SWHR-C-0156] omits a category with no details in the requested locale (in-test fixture)", () => {
    // Simulates REPTILES-without-zh_CN (SWHR-R-0087.02): the seeded
    // REPTILES category already has all three locales (SWHR-T-0061), so
    // this scenario needs its own fixture rather than the seed.
    db.insert(category).values({ id: "RPT-NOZH" }).run();
    db.insert(categoryDetails)
      .values({ categoryId: "RPT-NOZH", locale: "en_US", name: "No Chinese Details" })
      .run();

    const zhCategoryIds = listCategories("zh_CN").map((c) => c.categoryId);

    expect(zhCategoryIds).not.toContain("RPT-NOZH");
    expect(zhCategoryIds).toContain("DOGS");
  });
});

describe("listProducts", () => {
  it("[SWHR-C-0151] lists K9-BD-01 only under DOGS, never under another category", () => {
    const dogsIds = listProducts("DOGS", "en_US", 0, 20).items.map((p) => p.productId);
    const catsIds = listProducts("CATS", "en_US", 0, 20).items.map((p) => p.productId);

    expect(dogsIds).toContain("K9-BD-01");
    expect(catsIds).not.toContain("K9-BD-01");
  });

  it("[SWHR-C-0158] lists DOGS products alphabetically", () => {
    const names = listProducts("DOGS", "en_US", 0, 20)
      .items.filter((p) => ["K9-BD-01", "K9-DL-01", "K9-PO-02"].includes(p.productId))
      .map((p) => p.name);

    expect(names).toEqual(["Bulldog", "Dalmation", "Poodle"]);
  });

  it("[SWHR-C-0159] returns an empty page for an unknown category, and no error is raised", () => {
    const page = listProducts("UNICORNS", "en_US", 0, 2);

    expect(page.items).toEqual([]);
    expect(page.paging).toMatchObject({ hasNext: false, hasPrevious: false });
  });
});

describe("listItems", () => {
  it("[SWHR-C-0160] items of K9-BD-01 carry product id K9-BD-01 and category id DOGS", () => {
    const page = listItems("K9-BD-01", "en_US", 0, 10);

    expect(page.items.map((i) => i.itemId).sort()).toEqual(["EST-6", "EST-7"]);
    for (const view of page.items) {
      expect(view).toMatchObject({ productId: "K9-BD-01", categoryId: "DOGS" });
    }
  });

  it("[SWHR-C-0155] hides EST-15 from its product's ja_JP item listing", () => {
    const ids = listItems("K9-CW-01", "ja_JP", 0, 10).items.map((i) => i.itemId);

    expect(ids).not.toContain("EST-15");
    expect(ids).toContain("EST-14");
  });

  describe("paging (in-test fixture: a product with 5 items)", () => {
    const PRODUCT_ID = "PG-PR-01";
    const ITEM_IDS = ["PG-IT-01", "PG-IT-02", "PG-IT-03", "PG-IT-04", "PG-IT-05"];

    beforeAll(() => {
      db.insert(category).values({ id: "PGCAT" }).run();
      db.insert(categoryDetails)
        .values({ categoryId: "PGCAT", locale: "en_US", name: "Paging Fixture" })
        .run();
      db.insert(product).values({ id: PRODUCT_ID, categoryId: "PGCAT" }).run();
      db.insert(productDetails)
        .values({ productId: PRODUCT_ID, locale: "en_US", name: "Paging Product" })
        .run();

      for (const itemId of ITEM_IDS) {
        db.insert(item).values({ id: itemId, productId: PRODUCT_ID }).run();
        db.insert(itemDetails)
          .values({
            itemId,
            locale: "en_US",
            name: itemId,
            description: "Paging fixture item",
            image: "test.svg",
            listPrice: 100,
            unitCost: 50,
          })
          .run();
      }
    });

    it("[SWHR-C-0168] start 2, size 2 of 5 items returns items 3-4 with next at 4", () => {
      const page = listItems(PRODUCT_ID, "en_US", 2, 2);

      expect(page.items.map((i) => i.itemId)).toEqual(["PG-IT-03", "PG-IT-04"]);
      expect(page.paging).toMatchObject({ hasNext: true, nextStart: 4 });
    });

    it("[SWHR-C-0169] start 4, size 2 of 5 items returns only item 5 with no next", () => {
      const page = listItems(PRODUCT_ID, "en_US", 4, 2);

      expect(page.items.map((i) => i.itemId)).toEqual(["PG-IT-05"]);
      expect(page.paging).toMatchObject({ hasNext: false });
    });

    it("[SWHR-C-0170] start 9 beyond 5 items returns an empty page without navigation or error", () => {
      const page = listItems(PRODUCT_ID, "en_US", 9, 2);

      expect(page.items).toEqual([]);
      expect(page.paging).toMatchObject({ hasNext: false, hasPrevious: false });
    });
  });
});

describe("parseKeywords", () => {
  it("[SWHR-C-0163] parses 'dog dog puppy' as the keywords dog and puppy, once each", () => {
    expect(parseKeywords("dog dog puppy")).toEqual(["dog", "puppy"]);
  });

  it("returns no keywords for a blank query", () => {
    expect(parseKeywords("   ")).toEqual([]);
  });
});

describe("searchItems", () => {
  it("[SWHR-C-0164] returns an empty page with no navigation for a blank query", () => {
    const result = searchItems(" ", "en_US", 0, 2);

    expect(result.items).toEqual([]);
    expect(result.keywords).toEqual([]);
    expect(result.paging).toMatchObject({ hasNext: false, hasPrevious: false });
  });

  it("[SWHR-C-0165] 'bull fish' returns items of both Bulldog and Goldfish", () => {
    const ids = searchItems("bull fish", "en_US", 0, 50).items.map((i) => i.itemId);

    expect(ids).toEqual(expect.arrayContaining(["EST-6", "EST-7", "EST-5"]));
  });

  it("[SWHR-C-0166] 'BULL' matches Bulldog case-insensitively", () => {
    const ids = searchItems("BULL", "en_US", 0, 50).items.map((i) => i.itemId);

    expect(ids).toEqual(expect.arrayContaining(["EST-6", "EST-7"]));
  });

  it("[SWHR-C-0167] 'fish' returns every FISH item with en_US details, excluding one that has none", () => {
    // In-test fixture: a FISH item with no en_US details, proving the "with
    // details in the locale" half of SWHR-R-0093.03 (v2) — every seeded
    // FISH item already has en_US details, so this needs its own row.
    db.insert(product).values({ id: "FI-XX-99", categoryId: "FISH" }).run();
    db.insert(productDetails)
      .values({ productId: "FI-XX-99", locale: "en_US", name: "Undetailed Fish" })
      .run();
    db.insert(item).values({ id: "EST-99", productId: "FI-XX-99" }).run();
    db.insert(itemDetails)
      .values({
        itemId: "EST-99",
        locale: "zh_CN",
        name: "无详情鱼",
        description: "仅中文详情。",
        image: "fish.svg",
        listPrice: 100,
        unitCost: 50,
      })
      .run();

    const ids = searchItems("fish", "en_US", 0, 100).items.map((i) => i.itemId);

    expect(ids).toEqual(expect.arrayContaining(["EST-1", "EST-2", "EST-3", "EST-4", "EST-5"]));
    expect(ids).not.toContain("EST-99");
  });

  it("[SWHR-C-0155] hides EST-15 from a ja_JP search that would otherwise match its product", () => {
    const ids = searchItems("dogs", "ja_JP", 0, 100).items.map((i) => i.itemId);

    expect(ids).not.toContain("EST-15");
  });
});
