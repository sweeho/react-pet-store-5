import { expect, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * Language switching from every page (SWHR-R-0008) and locale-specific page
 * resolution (SWHR-R-0013), against a real dev server and a real session
 * cookie — see routes/api/locale.{get,post}.ts and src/i18n/LocaleProvider.tsx.
 * Prefer src/components/layout/SiteLayout.test.tsx for anything that
 * doesn't specifically need a real browser.
 */
test.describe("Language switch", () => {
  test("[SWHR-R-0008.01] switching language on a placeholder page re-renders the same URL in Japanese", async ({
    page,
  }) => {
    await page.goto("/cart");

    await expect(page.getByRole("heading", { level: 1, name: "Cart" })).toBeVisible();

    await page.getByRole("button", { name: "日本語" }).click();

    await expect(page).toHaveURL("/cart");
    await expect(page.getByRole("heading", { level: 1, name: "カート" })).toBeVisible();
    await expect(page.getByRole("button", { name: "日本語" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("[SWHR-R-0008.02] English, Japanese and Chinese controls are present on a placeholder page", async ({
    page,
  }) => {
    await page.goto("/checkout");

    await expect(page.getByRole("button", { name: "English" })).toBeVisible();
    await expect(page.getByRole("button", { name: "日本語" })).toBeVisible();
    await expect(page.getByRole("button", { name: "中文" })).toBeVisible();
  });

  test("[SWHR-R-0013.01] a ?locale= query overrides the session locale for this page only", async ({
    page,
  }) => {
    // /cart, not /account: SWHR-T-0044 gates /account behind sign-on
    // (SWHR-R-0064), so an anonymous visit no longer renders it directly.
    await page.goto("/cart?locale=zh_CN");

    await expect(page.getByRole("heading", { level: 1, name: "购物车" })).toBeVisible();

    // The override was not persisted: a fresh navigation without the query
    // parameter falls back to the (still en_US) session locale.
    await page.goto("/cart");
    await expect(page.getByRole("heading", { level: 1, name: "Cart" })).toBeVisible();
  });

  test("the language switch is also available in the mobile drawer and updates the page in place", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/search");

    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "中文" }).click();

    await expect(page).toHaveURL("/search");
    await expect(page.getByRole("heading", { level: 1, name: "搜索" })).toBeVisible();
  });
});
