import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import getCategoryRoute from "./categories/[categoryId].get";
import getCategoriesRoute from "./categories/index.get";
import getItemRoute from "./items/[itemId].get";
import getProductRoute from "./products/[productId].get";
import getSearchRoute from "./search.get";

/**
 * INTEGRATION TEST
 *
 * SWHR-R-0097.01: every catalog route is reachable with a bare, freshly
 * built H3Event — no auth middleware run first, no session, no cookie. If
 * any of these required sign-on, calling the handler directly (the same
 * pattern every route test in this file's siblings uses) would throw
 * before returning catalog content. Complements the real-browser proof in
 * e2e/catalog-anonymous-access.spec.ts (SWHR-T-0060 builds the screens
 * these routes back).
 */
function anonymousEvent(url: string, params: Record<string, string> = {}): H3Event {
  return new H3Event(new Request(url), { params, locale: "en_US" });
}

describe("anonymous catalog access", () => {
  it("[SWHR-C-0174] opens a category with no sign-on requested", async () => {
    const event = anonymousEvent("http://localhost/api/catalog/categories/DOGS", {
      categoryId: "DOGS",
    });

    const result = await getCategoryRoute(event);

    expect(result.category).toMatchObject({ categoryId: "DOGS" });
  });

  it("[SWHR-C-0174] lists categories with no sign-on requested", async () => {
    const event = anonymousEvent("http://localhost/api/catalog/categories");

    const result = await getCategoriesRoute(event);

    expect(result.categories.length).toBeGreaterThan(0);
  });

  it("[SWHR-C-0174] opens a product with no sign-on requested", async () => {
    const event = anonymousEvent("http://localhost/api/catalog/products/K9-BD-01", {
      productId: "K9-BD-01",
    });

    const result = await getProductRoute(event);

    expect(result.product).toMatchObject({ productId: "K9-BD-01" });
    // Also pins this ticket's own change to the route (paging), so this
    // case doesn't pass merely because the pre-existing product route was
    // already anonymous before SWHR-T-0059.
    expect(result.paging).toMatchObject({ start: 0, count: 2 });
  });

  it("[SWHR-C-0174] opens an item with no sign-on requested", async () => {
    const event = anonymousEvent("http://localhost/api/catalog/items/EST-6", { itemId: "EST-6" });

    const result = await getItemRoute(event);

    expect(result.item).toMatchObject({ itemId: "EST-6" });
  });

  it("[SWHR-C-0174] runs a search with no sign-on requested", async () => {
    const event = anonymousEvent("http://localhost/api/catalog/search?keywords=dog");

    const result = await getSearchRoute(event);

    expect(result.items.length).toBeGreaterThan(0);
  });
});
