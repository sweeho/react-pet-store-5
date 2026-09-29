import { expect, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * Drives the real app in a real browser against the seeded catalog
 * (design.md SWHR-T-0060). Prefer the component-level UI tests
 * (src/pages/**\/*.test.tsx) for anything that doesn't specifically need a
 * real browser — it's far faster; this file covers the cross-page journeys
 * and the real Add to Cart round trip those can't.
 */
test.describe("Home → category → product → item journey", () => {
  test("[SWHR-C-0180] browsing Dogs then Bulldog lists Bulldog items, each with Add to Cart", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByRole("navigation", { name: "Pets" })
      .getByRole("link", { name: "Dogs" })
      .click();
    await expect(page).toHaveURL(/\/category\/DOGS/);

    await page.getByRole("link", { name: "Bulldog" }).click();
    await expect(page).toHaveURL("/product/K9-BD-01");

    const maleRow = page.getByRole("listitem").filter({ hasText: "Male Adult Bulldog" });
    await expect(maleRow).toBeVisible();
    await expect(maleRow.getByRole("button", { name: "Add to Cart" })).toBeVisible();

    for (const row of await page.getByRole("listitem").all()) {
      await expect(row.getByRole("button", { name: "Add to Cart" })).toBeVisible();
    }
  });

  test("[SWHR-C-0181] selecting the Fish region on the home map opens the Fish listing", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByRole("group", { name: "Choose a pet to start" })
      .getByRole("link", { name: /Fish/ })
      .click();

    await expect(page).toHaveURL(/\/category\/FISH/);
    await expect(page.getByRole("heading", { level: 1, name: "Fish" })).toBeVisible();
  });

  test("[SWHR-C-0187] selecting Bulldog on the DOGS category page opens the Bulldog item listing", async ({
    page,
  }) => {
    await page.goto("/category/DOGS");

    await page.getByRole("link", { name: "Bulldog" }).click();

    await expect(page).toHaveURL("/product/K9-BD-01");
    await expect(page.getByRole("heading", { level: 1, name: "Bulldog" })).toBeVisible();
  });
});

test.describe("Category and product listing paging", () => {
  test("[SWHR-C-0186] DOGS (6 products) shows the first 2 with a Next link and no Previous link", async ({
    page,
  }) => {
    await page.goto("/category/DOGS");

    await expect(page.getByRole("heading", { level: 1, name: "Dogs" })).toBeVisible();
    await expect(page.getByRole("listitem")).toHaveCount(2);
    await expect(page.getByRole("link", { name: /Next/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Previous/ })).toHaveCount(0);
  });

  test("[SWHR-C-0173] a category opened with no paging parameters shows 2 products and a Next link", async ({
    page,
  }) => {
    await page.goto("/category/DOGS");

    await expect(page.getByRole("listitem")).toHaveCount(2);
    await expect(page.getByRole("link", { name: /Next/ })).toBeVisible();
  });
});

test.describe("Item detail page", () => {
  test("[SWHR-C-0183] EST-6 detail page shows title, image, list price and your price", async ({
    page,
  }) => {
    await page.goto("/item/EST-6");

    await expect(page.getByRole("heading", { level: 1, name: "Male Adult Bulldog" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Male Adult Bulldog" })).toBeVisible();
    await expect(page.getByText("List Price")).toBeVisible();
    await expect(page.getByText("$18.50")).toBeVisible();
    await expect(page.getByText("Your Price")).toBeVisible();
    await expect(page.getByText("$12.00")).toBeVisible();
  });

  test("[SWHR-C-0184] Add to Cart on the EST-6 detail page adds it to the cart", async ({
    page,
  }) => {
    await page.goto("/item/EST-6");

    await page.getByRole("button", { name: "Add to Cart" }).click();
    await expect(page.getByText("Added to cart")).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByText("Male Adult Bulldog")).toBeVisible();
    await expect(page.getByText("Quantity: 1")).toBeVisible();
  });
});

test.describe("Pets menu", () => {
  test("[SWHR-C-0185] lists five categories on every storefront page, and Cats opens its listing", async ({
    page,
  }) => {
    const categories = ["Birds", "Cats", "Dogs", "Fish", "Reptiles"];

    for (const path of ["/", "/category/DOGS", "/product/K9-BD-01", "/item/EST-6", "/search"]) {
      await page.goto(path);
      const menu = page.getByRole("navigation", { name: "Pets" });
      for (const category of categories) {
        await expect(menu.getByRole("link", { name: category })).toBeVisible();
      }
    }

    await page
      .getByRole("navigation", { name: "Pets" })
      .getByRole("link", { name: "Cats" })
      .click();
    await expect(page).toHaveURL(/\/category\/CATS/);
    await expect(page.getByRole("heading", { level: 1, name: "Cats" })).toBeVisible();
  });
});

test.describe("Product item listing", () => {
  test("[SWHR-C-0189] Add to Cart on the Male Adult Bulldog row adds that item", async ({
    page,
  }) => {
    await page.goto("/product/K9-BD-01");

    const maleRow = page.getByRole("listitem").filter({ hasText: "Male Adult Bulldog" });
    await maleRow.getByRole("button", { name: "Add to Cart" }).click();
    await expect(maleRow.getByText("Added to cart")).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByText("Male Adult Bulldog")).toBeVisible();
    await expect(page.getByText("Quantity: 1")).toBeVisible();
    await expect(page.getByText("Female Puppy Bulldog")).toHaveCount(0);
  });
});

test.describe("Search", () => {
  test("[SWHR-C-0190] searching 'bulldog' shows the matching-keywords heading and one row per Bulldog item", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("searchbox").fill("bulldog");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/\/search\?keywords=bulldog/);
    await expect(page.getByText("Items matching any of:")).toBeVisible();
    await expect(page.getByText("bulldog", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("listitem").filter({ hasText: "Male Adult Bulldog" }),
    ).toBeVisible();
    await expect(
      page.getByRole("listitem").filter({ hasText: "Female Puppy Bulldog" }),
    ).toBeVisible();
  });

  test("[SWHR-C-0191] searching 'zebra' shows the no-results message and no rows", async ({
    page,
  }) => {
    await page.goto("/search?keywords=zebra");

    await expect(page.getByText("No results were found for your search.")).toBeVisible();
    await expect(page.getByRole("listitem")).toHaveCount(0);
  });

  test("[SWHR-C-0192] submitting an empty keyword shows the no-results message", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("searchbox").fill("");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByText("No results were found for your search.")).toBeVisible();
  });
});
