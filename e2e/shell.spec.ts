import { expect, type Page, test } from "@playwright/test";

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

/**
 * UI / E2E TEST
 *
 * Global navigation area labels (design.md §D1): resolved from the `shell`
 * screen by area id, not the removed PRIMARY_AREAS.label field, so they
 * move with the session locale. The category half (AC-4) is a regression
 * check only — S-0005 already fixed it (design.md § Context).
 */
test.describe("Global navigation locale labels", () => {
  // The top language bar is `hidden sm:flex` (SiteHeader.tsx), so on a
  // 375px viewport it isn't actionable — switch language from inside the
  // drawer instead, then reopen the (now-relabelled) menu button, mirroring
  // SiteLayout.test.tsx's "switching language from the mobile drawer..." test.
  async function switchToJapaneseFromMobileDrawer(page: Page) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "日本語" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.getByRole("button", { name: "メニューを開く" }).click();
  }

  test("[SWHR-C-0436] mobile menu storefront entries render in Japanese", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await switchToJapaneseFromMobileDrawer(page);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    for (const name of ["検索", "カート", "購入手続き", "アカウント", "管理", "サプライヤー"]) {
      await expect(dialog.getByRole("link", { name })).toBeVisible();
    }
    for (const name of ["Search", "Cart", "Checkout", "Account", "Administration", "Supplier"]) {
      await expect(dialog.getByRole("link", { name, exact: true })).toHaveCount(0);
    }
  });

  test("[SWHR-C-0431] mobile menu lists pet categories in Japanese", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await switchToJapaneseFromMobileDrawer(page);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    for (const name of ["鳥", "猫", "犬", "魚", "爬虫類"]) {
      await expect(dialog.getByRole("link", { name })).toBeVisible();
    }
    for (const name of ["Birds", "Cats", "Dogs", "Fish", "Reptiles"]) {
      await expect(dialog.getByRole("link", { name, exact: true })).toHaveCount(0);
    }
  });

  test("[SWHR-C-0438] desktop global navigation shows Search and Checkout in Chinese", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "中文" }).click();

    const nav = page.getByRole("navigation", { name: "Global" });
    await expect(nav.getByRole("link", { name: "搜索" })).toHaveAttribute("href", "/search");
    await expect(nav.getByRole("link", { name: "结账" })).toHaveAttribute("href", "/checkout");
  });

  test("[SWHR-C-0440] mobile menu storefront entries render in English by default", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    for (const name of ["Search", "Cart", "Checkout", "Account", "Administration", "Supplier"]) {
      await expect(dialog.getByRole("link", { name })).toBeVisible();
    }
  });
});
