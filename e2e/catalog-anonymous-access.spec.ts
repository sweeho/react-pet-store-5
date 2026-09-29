import { expect, test } from "@playwright/test";

/**
 * E2E TEST
 *
 * SWHR-R-0097.01: catalog browsing never requires sign-on. The category,
 * product, item and search screens themselves are still placeholders
 * (SWHR-T-0060 builds them) — this ticket's own deliverable is the read-only
 * JSON routes under routes/api/catalog/, so "opens a category/product/item
 * page" and "runs a search" are exercised at that layer, against the real
 * server process and the real seeded database (playwright.config.ts's
 * webServer), with a fresh, cookie-less request context per case. "No
 * sign-on requested" is proven the way it is observable for a JSON API: a
 * 200 with real catalog content, never a redirect or an auth error.
 */
test.describe("Anonymous catalog access", () => {
  test("[SWHR-C-0174] a visitor with no session opens a category, a product, an item and runs a search", async ({
    request,
  }) => {
    const category = await request.get("/api/catalog/categories/DOGS");
    expect(category.ok()).toBe(true);
    const categoryBody = await category.json();
    expect(categoryBody.category).toMatchObject({ categoryId: "DOGS" });
    expect(categoryBody.items.length).toBeGreaterThan(0);

    const product = await request.get("/api/catalog/products/K9-BD-01");
    expect(product.ok()).toBe(true);
    const productBody = await product.json();
    expect(productBody.product).toMatchObject({ productId: "K9-BD-01", name: "Bulldog" });

    const item = await request.get("/api/catalog/items/EST-6");
    expect(item.ok()).toBe(true);
    const itemBody = await item.json();
    expect(itemBody.item).toMatchObject({ itemId: "EST-6" });

    const search = await request.get("/api/catalog/search?keywords=dog");
    expect(search.ok()).toBe(true);
    const searchBody = await search.json();
    expect(searchBody.items.length).toBeGreaterThan(0);

    // None of the four responses redirected to sign-in or carried a
    // session-establishing Set-Cookie the way a gated route would.
    for (const response of [category, product, item, search]) {
      expect(response.status()).toBe(200);
      expect(new URL(response.url()).pathname).not.toBe("/signin");
    }
  });
});
