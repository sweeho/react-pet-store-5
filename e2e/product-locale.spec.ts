import { expect, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * The product-page scenario of "language switching from every page"
 * (SWHR-R-0008.01): switching language on a product page re-renders the
 * SAME product page in Japanese, the session locale becomes ja_JP, and the
 * cart's locale (read back via GET /api/locale, since the cart page itself
 * is still a placeholder — see routes/api/locale.get.ts) moves with it.
 * Prefer src/pages/product/[productId].test.tsx for anything that doesn't
 * specifically need a real browser and a real session cookie.
 */
test.describe("Product page language switch", () => {
  test("[SWHR-R-0008.01] switching language on the product page re-renders it in Japanese and moves the cart locale", async ({
    page,
  }) => {
    await page.goto("/product/K9-BD-01");

    await expect(page.getByRole("heading", { level: 1, name: "Bulldog" })).toBeVisible();
    await expect(page.getByText("Male Adult Bulldog")).toBeVisible();
    await expect(page.getByText("$18.50")).toBeVisible();

    await page.getByRole("button", { name: "日本語" }).click();

    await expect(page).toHaveURL("/product/K9-BD-01");
    await expect(page.getByRole("heading", { level: 1, name: "ブルドッグ" })).toBeVisible();
    await expect(page.getByText("オス成犬ブルドッグ")).toBeVisible();
    await expect(page.getByText("￥2,000")).toBeVisible();

    // page.request shares the browser context's cookie jar, so this reads
    // back the same session the language switch just wrote (unlike the
    // top-level `request` fixture, which is a separate, cookie-less context).
    const localeResponse = await page.request.get("/api/locale");
    const body = await localeResponse.json();
    expect(body.locale).toBe("ja_JP");
    expect(body.cartLocale).toBe("ja_JP");
  });
});
