import { expect, type Page, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * The shopping-cart journey (swhr-i-0008, design.md phase 5.8), anonymous and
 * in en_US. Items are added through the API on the page's own request context,
 * which shares the page's session cookie, so each test owns its own cart.
 */

async function addItems(page: Page, itemIds: string[]) {
  for (const itemId of itemIds) {
    const response = await page.request.post("/api/cart/items", { data: { itemId } });
    expect(response.ok()).toBe(true);
  }
}

test.describe("Shopping cart journey", () => {
  test("[SWHR-C-0234] Remove on the EST-6 row removes it and redisplays the cart", async ({
    page,
  }) => {
    await addItems(page, ["EST-6", "EST-1"]);
    await page.goto("/cart");
    await expect(page.getByRole("row")).toHaveCount(3);

    await page.getByRole("button", { name: /^Remove .*Bulldog/ }).click();

    await expect(page.getByRole("row")).toHaveCount(2);
    await expect(page.getByText("EST-6 ·")).toHaveCount(0);
    await expect(page.getByText("EST-1 ·")).toBeVisible();
  });

  test("[SWHR-C-0235] Update Cart submits all quantities: EST-6 to 5, EST-1 to 0", async ({
    page,
  }) => {
    await addItems(page, ["EST-6", "EST-1"]);
    await page.goto("/cart");
    await page.getByRole("textbox", { name: /^Quantity for .*Bulldog/ }).fill("5");
    const est1 = page.getByRole("row").filter({ hasText: "EST-1 ·" });
    await est1.getByRole("textbox").fill("0");

    const patches: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "PATCH" && request.url().endsWith("/api/cart")) {
        patches.push(request.postData() ?? "");
      }
    });
    await page.getByRole("button", { name: "Update Cart" }).click();

    await expect(page.getByRole("row")).toHaveCount(2);
    await expect(page.getByText("EST-1 ·")).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: /^Quantity for .*Bulldog/ })).toHaveValue("5");
    expect(patches).toHaveLength(1);
    expect(JSON.parse(patches[0] ?? "{}")).toEqual({ quantities: { "EST-6": "5", "EST-1": "0" } });
  });

  test("[SWHR-C-0236] Check Out starts the checkout step (sign-in first when anonymous)", async ({
    page,
  }) => {
    await addItems(page, ["EST-6"]);
    await page.goto("/cart");

    await page.getByRole("link", { name: /Check Out/ }).click();

    await expect(page).toHaveURL("/signin");
  });
});
