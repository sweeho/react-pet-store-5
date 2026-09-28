import { expect, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * The locale selection screen, its confirmation, and the rejected-change
 * error (SWHR-R-0023, SWHR-R-0009), against a real dev server and a real
 * session cookie. Prefer src/pages/locale/index.test.tsx and
 * src/pages/locale/changed.test.tsx for anything that doesn't specifically
 * need a real browser.
 */
test.describe("Locale selection", () => {
  test("[SWHR-R-0023.01] shows the four-option choice list and a Change Locale control", async ({
    page,
  }) => {
    await page.goto("/locale");

    await expect(page.getByRole("heading", { level: 1, name: "Change language" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "US English" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "German" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Japanese" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Simplified Chinese" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Change Locale" })).toBeVisible();
  });

  test("[SWHR-R-0023.02] choosing Japanese and submitting switches the session locale and shows the confirmation", async ({
    page,
  }) => {
    await page.goto("/locale");

    await page.getByRole("radio", { name: "Japanese" }).click();
    await page.getByRole("button", { name: "Change Locale" }).click();

    await expect(page).toHaveURL("/locale/changed");
    await expect(page.getByRole("heading", { level: 1, name: "言語を変更しました" })).toBeVisible();
    await expect(page.getByText("ja_JP")).toBeVisible();

    // The change reached server-side business state (SWHR-R-0010): a fresh
    // navigation stays in Japanese rather than resetting to en_US.
    await page.goto("/cart");
    await expect(page.getByRole("heading", { level: 1, name: "カート" })).toBeVisible();
  });

  test("[SWHR-R-0009.01] a rejected locale change leaves the session locale en_US", async ({
    page,
  }) => {
    await page.goto("/locale?requested=ja");

    await expect(
      page.getByRole("heading", { level: 1, name: "Unable to change language to ja" }),
    ).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByRole("heading", { level: 1, name: "Cart" })).toBeVisible();
  });
});
