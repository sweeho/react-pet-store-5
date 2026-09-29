import { expect, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * Drives the real app in a real browser via Playwright — the outermost
 * layer of the test pyramid. Prefer the component-level UI test
 * (src/pages/index.test.tsx) for anything that doesn't specifically need a
 * real browser — it's far faster.
 */
test.describe("Home page", () => {
  test("[SWHR-C-0002] root URL renders the landing page", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: "Find your next pet" })).toBeVisible();
    await expect(page).toHaveURL("/");
  });

  test("the picture map offers a region for every pet category", async ({ page }) => {
    await page.goto("/");

    const map = page.getByRole("group", { name: "Choose a pet to start" });
    for (const category of ["Birds", "Cats", "Dogs", "Fish", "Reptiles"]) {
      await expect(map.getByRole("link", { name: new RegExp(category) })).toBeVisible();
    }
  });
});
