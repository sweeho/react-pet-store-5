import { H3Event } from "nitro/h3";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { item, itemDetails, product, productDetails } from "../../db/schema";
import getCategoryRoute from "../../routes/api/catalog/categories/[categoryId].get";
import getCategoriesRoute from "../../routes/api/catalog/categories/index.get";
import getProductRoute from "../../routes/api/catalog/products/[productId].get";
import getSearchRoute from "../../routes/api/catalog/search.get";
import { formatPrice } from "../locale/money";
import { DEFAULT_PAGE_SIZE } from "./paging";
import { listItems, searchItems } from "./queries";

/**
 * INTEGRATION TEST
 *
 * Pins the five open questions design.md records as settled for this
 * sprint (design.md "Open questions settled for this sprint" — Q1, Q3, Q4,
 * Q7, Q8). Each test title cites its question code (AC-6). Runs against
 * the same seeded, in-memory db as queries.test.ts; Q3/Q4's paging cases
 * add an in-test fixture product under the existing DOGS category so they
 * don't change the category count Q4 also asserts on.
 */
function eventFor(
  url: string,
  context: { params?: Record<string, string>; locale?: string } = {},
): H3Event {
  return new H3Event(new Request(url), context);
}

describe("Q1 — search matches the category identifier, not its localized name (design.md Q1, D3)", () => {
  it("[Q1] a search for 'FISH' and for 'fish' return the same en_US items", () => {
    const upper = searchItems("FISH", "en_US", 0, 100).items.map((i) => i.itemId);
    const lower = searchItems("fish", "en_US", 0, 100).items.map((i) => i.itemId);

    expect(upper.length).toBeGreaterThan(0);
    expect(upper).toEqual(lower);
  });

  it("[Q1] a ja_JP search for the FISH category's ja_JP name ('魚') matches no item solely by category", () => {
    const ids = searchItems("魚", "ja_JP", 0, 100).items.map((i) => i.itemId);

    // EST-1 (FI-SW-01/Angelfish) belongs to FISH, but neither its ja_JP
    // product name nor its ja_JP item description contains "魚" — if the
    // category's localized name were matched (rather than the ASCII id
    // "FISH", which never matches a ja_JP query), EST-1 would appear here
    // by category membership alone.
    expect(ids).not.toContain("EST-1");
  });
});

describe("Q3/Q4 paging fixture — a product with 5 items under the existing DOGS category", () => {
  const PRODUCT_ID = "Q3-PG-01";
  const ITEM_IDS = ["Q3-IT-01", "Q3-IT-02", "Q3-IT-03", "Q3-IT-04", "Q3-IT-05"];

  beforeAll(() => {
    db.insert(product).values({ id: PRODUCT_ID, categoryId: "DOGS" }).run();
    db.insert(productDetails)
      .values({ productId: PRODUCT_ID, locale: "en_US", name: "Q3 Fixture Product" })
      .run();

    for (const itemId of ITEM_IDS) {
      db.insert(item).values({ id: itemId, productId: PRODUCT_ID }).run();
      db.insert(itemDetails)
        .values({
          itemId,
          locale: "en_US",
          name: itemId,
          description: "Q3/Q4 fixture item",
          image: "test.svg",
          listPrice: 100,
          unitCost: 50,
        })
        .run();
    }
  });

  it("[Q3] a last page starting at 4 (1 of 5 items, page size 2) offers a previous page starting at 3", () => {
    const page = listItems(PRODUCT_ID, "en_US", 4, 2);

    expect(page.items.map((i) => i.itemId)).toEqual(["Q3-IT-05"]);
    expect(page.paging).toMatchObject({ hasPrevious: true, previousStart: 3 });
  });

  it("[Q4] the product route opened without paging parameters shows at most 2 of this product's 5 items", async () => {
    const event = eventFor(`http://localhost/api/catalog/products/${PRODUCT_ID}`, {
      params: { productId: PRODUCT_ID },
      locale: "en_US",
    });

    const result = await getProductRoute(event);

    expect(result.items.length).toBeLessThanOrEqual(2);
    expect(result.paging).toMatchObject({ start: 0, count: 2, hasNext: true });
  });
});

describe("Q4 — default page sizes (design.md Q4, D6)", () => {
  it("[Q4] DEFAULT_PAGE_SIZE is 2", () => {
    expect(DEFAULT_PAGE_SIZE).toBe(2);
  });

  it("[Q4] the category route opened without paging parameters shows at most 2 rows", async () => {
    const event = eventFor("http://localhost/api/catalog/categories/DOGS", {
      params: { categoryId: "DOGS" },
      locale: "en_US",
    });

    const result = await getCategoryRoute(event);

    expect(result.items.length).toBeLessThanOrEqual(2);
    expect(result.paging).toMatchObject({ count: 2 });
  });

  it("[Q4] the search route opened without paging parameters shows at most 2 rows", async () => {
    const event = eventFor("http://localhost/api/catalog/search?keywords=dogs", {
      locale: "en_US",
    });

    const result = await getSearchRoute(event);

    expect(result.items.length).toBeLessThanOrEqual(2);
    expect(result.paging).toMatchObject({ count: 2, hasNext: true });
  });

  it("[Q4] the Pets menu (categories route) lists every category available in en_US (5), uncapped", async () => {
    const event = eventFor("http://localhost/api/catalog/categories", { locale: "en_US" });

    const result = await getCategoriesRoute(event);

    expect(
      result.categories.map((category: { categoryId: string }) => category.categoryId).sort(),
    ).toEqual(["BIRDS", "CATS", "DOGS", "FISH", "REPTILES"]);
  });
});

describe("Q7 — which price each listing shows (design.md Q7)", () => {
  it("[Q7] the product listing shows EST-6's list price, $18.50 in en_US", async () => {
    const event = eventFor("http://localhost/api/catalog/products/K9-BD-01", {
      params: { productId: "K9-BD-01" },
      locale: "en_US",
    });

    const result = await getProductRoute(event);
    const est6 = result.items.find((view: { itemId: string }) => view.itemId === "EST-6");

    expect(est6).toMatchObject({ listPrice: 1850 });
    expect(formatPrice(est6!.listPrice, "en_US")).toBe("$18.50");
  });

  it("[Q7] the search results show EST-6's unit cost, $12.00 in en_US", async () => {
    const event = eventFor("http://localhost/api/catalog/search?keywords=bulldog", {
      locale: "en_US",
    });

    const result = await getSearchRoute(event);
    const est6 = result.items.find((view: { itemId: string }) => view.itemId === "EST-6");

    expect(est6).toMatchObject({ unitCost: 1200 });
    expect(formatPrice(est6!.unitCost, "en_US")).toBe("$12.00");
  });
});

describe("Q8 — deterministic ordering by item identifier (design.md Q8)", () => {
  it("[Q8] two consecutive listItems calls for the same product return identical id sequences in ascending item-id order", () => {
    const first = listItems("K9-BD-01", "en_US", 0, 10).items.map((view) => view.itemId);
    const second = listItems("K9-BD-01", "en_US", 0, 10).items.map((view) => view.itemId);

    expect(first.length).toBeGreaterThan(1);
    expect(first).toEqual(second);
    expect(first).toEqual([...first].sort());
  });

  it("[Q8] two consecutive searchItems calls for the same query return identical id sequences in ascending item-id order", () => {
    const first = searchItems("dogs", "en_US", 0, 50).items.map((view) => view.itemId);
    const second = searchItems("dogs", "en_US", 0, 50).items.map((view) => view.itemId);

    expect(first.length).toBeGreaterThan(1);
    expect(first).toEqual(second);
    expect(first).toEqual([...first].sort());
  });
});
