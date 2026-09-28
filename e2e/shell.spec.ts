import { expect, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * Confirms every route — the landing page, every primary area, and an
 * unknown route — renders inside the same shell (header, Global
 * navigation, main, footer), and that the navigation folds behind a menu
 * button below the `lg` breakpoint. Prefer src/components/layout/SiteLayout.test.tsx
 * for anything that doesn't specifically need a real browser.
 *
 * Routes are the same literal set src/constants/navigation.ts's
 * PRIMARY_AREAS produces; hardcoded rather than imported, since e2e/ and
 * src/ are separate tsconfig projects (see e2e/home.spec.ts for the same
 * pattern).
 */
const PRIMARY_ROUTES = [
  "/",
  "/category/BIRDS",
  "/category/CATS",
  "/category/DOGS",
  "/category/FISH",
  "/category/REPTILES",
  "/search",
  "/cart",
  "/checkout",
  "/account",
  "/signin",
  "/admin",
  "/supplier",
];

test.describe("Site shell", () => {
  for (const route of PRIMARY_ROUTES) {
    test(`[SWHR-C-0004][SWHR-C-0008] the shell renders on ${route}`, async ({ page }) => {
      await page.goto(route);

      await expect(page.getByRole("banner")).toBeVisible();
      const nav = page.getByRole("navigation", { name: "Global" });
      await expect(nav).toBeVisible();
      await expect(nav.getByRole("link", { name: "Pet Store home" })).toHaveAttribute("href", "/");
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeVisible();
    });
  }

  test("[SWHR-C-0006][SWHR-C-0008] the shell, including the Global navigation, renders on the not-found page", async ({
    page,
  }) => {
    await page.goto("/does-not-exist");

    await expect(page.getByRole("banner")).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Global" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Pet Store home" })).toHaveAttribute("href", "/");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("the navigation folds behind a menu button below the lg breakpoint, and the panel opens and closes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    await page.getByRole("button", { name: "Open menu" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Birds" })).toBeVisible();

    await dialog.getByRole("button", { name: "Close menu" }).click();
    await expect(dialog).not.toBeVisible();
  });
});
