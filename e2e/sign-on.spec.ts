import { expect, type Page, test } from "@playwright/test";

import { completeAccountForm } from "./account-helpers";

/**
 * UI / E2E TEST
 *
 * The eight browser journeys design.md P14 assigns to this ticket, run
 * against a fresh, throwaway database per Playwright invocation
 * (playwright.config.ts's `webServer`, SQLITE_PATH — SWHR-T-0042/design.md
 * §Test-harness phase). Each test that signs up a new account picks its
 * own user name so the tests stay independent under `fullyParallel: true`
 * sharing one database for the run — see PLAN.md step 2 for which case
 * owns which name.
 */

async function signUpAndCompleteRegistration(page: Page, userId: string, password: string) {
  const newAccountForm = page.getByRole("form", { name: "I would like to sign up for an account" });
  // exact: true throughout this file — getByLabel's default match is a
  // substring, not the whole label, so "Password" alone also matches
  // "Repeat password" and "User name" alone also matches the checkbox
  // labelled "Remember My User Name" (CI caught both).
  await newAccountForm.getByLabel("User name", { exact: true }).fill(userId);
  await newAccountForm.getByLabel("Password", { exact: true }).fill(password);
  await newAccountForm.getByLabel("Repeat password").fill(password);
  await newAccountForm.getByRole("button", { name: "Create New Account" }).click();

  await completeAccountForm(page);
}

// Scoped to the item card named `itemName` (defaulting to the page's first
// item) rather than a bare `.first()` on every "Add to Cart" button — a
// product with more than one item (K9-BD-01/Bulldog has two) has no ORDER BY on its
// item list, so which item is DOM-first isn't a contract worth relying on.
// The button inside is targeted by role alone, not its "Add to Cart" text —
// each card has exactly one button, and the text is locale-dependent
// ("カートに追加" in Japanese; SWHR-C-0135 calls this after switching).
async function addToCart(page: Page, productId: string, itemName?: string, times = 1) {
  await page.goto(`/product/${productId}`);
  const card = itemName
    ? page.getByRole("listitem").filter({ hasText: itemName })
    : page.getByRole("listitem").first();
  const addButton = card.getByRole("button");
  for (let i = 0; i < times; i++) {
    // Each click fires its own POST /api/cart/items; waiting for the
    // response before the next click keeps repeated adds (SWHR-C-0135's
    // three) from racing each other client-side.
    const response = page.waitForResponse(
      (res) => res.url().includes("/api/cart/items") && res.request().method() === "POST",
    );
    await addButton.click();
    await response;
  }
}

test.describe("Sign-on journeys", () => {
  test("[SWHR-C-0103] unknown user 'ghost' is shown the Sign-in Error screen and stays signed out", async ({
    page,
  }) => {
    await page.goto("/signin");
    const returningForm = page.getByRole("form", { name: "Are you a returning customer?" });
    await returningForm.getByLabel("User name", { exact: true }).fill("ghost");
    await returningForm.getByLabel("Password", { exact: true }).fill("anything");
    await returningForm.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL("/signin-error");
    await expect(page.getByRole("heading", { name: "Sign-in Error" })).toBeVisible();
    await expect(
      page.getByText("The user name and password you entered were not found in our records."),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Try again" })).toBeVisible();

    await page.goto("/account");
    await expect(page).toHaveURL("/signin");
  });

  test("[SWHR-C-0106] header search for 'dog' opens the search results page for 'dog'", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("searchbox").fill("dog");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL("/search?keywords=dog");
    await expect(page.getByRole("heading", { name: "Search results" })).toBeVisible();
    await expect(page.getByText("Items matching any of:")).toBeVisible();
    await expect(page.getByText("dog", { exact: true })).toBeVisible();
  });

  test("[SWHR-C-0117] gated shopper signing on as alice is returned to the account page", async ({
    page,
  }, testInfo) => {
    // The case's own precondition credential — created here (PLAN.md step 2)
    // rather than seeded, then signed out so the actual gated scenario below
    // starts from a clean anonymous browser. Suffixed only on a retry, so a
    // partial first attempt that already created 'alice' doesn't collide
    // with the retry as a "duplicate user id" instead of the real failure.
    const userId = testInfo.retry === 0 ? "alice" : `alice-retry${testInfo.retry}`;

    await page.goto("/signin");
    await signUpAndCompleteRegistration(page, userId, "Secret1");
    await page
      .getByRole("navigation", { name: "Global" })
      .getByRole("button", { name: "Sign out" })
      .click();
    await expect(page).toHaveURL("/signed-out");

    await page.goto("/account");
    await expect(page).toHaveURL("/signin");

    const returningForm = page.getByRole("form", { name: "Are you a returning customer?" });
    await returningForm.getByLabel("User name", { exact: true }).fill(userId);
    await returningForm.getByLabel("Password", { exact: true }).fill("Secret1");
    await returningForm.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL("/account");
    await expect(
      page.getByRole("navigation", { name: "Global" }).getByRole("button", { name: "Sign out" }),
    ).toBeVisible();
  });

  test("[SWHR-C-0130] anonymous shopper adds an item to the cart without sign-on", async ({
    page,
  }) => {
    await addToCart(page, "K9-BD-01", "Male Adult Bulldog");

    await page.goto("/cart");
    await expect(page).toHaveURL("/cart");
    await expect(page.getByRole("link", { name: "Male Adult Bulldog" })).toBeVisible();
    await expect(page.getByLabel("Quantity for Male Adult Bulldog")).toHaveValue("1");
  });

  test("[SWHR-C-0132] registration from checkout signs on as dave and returns to order information", async ({
    page,
  }, testInfo) => {
    // Suffixed only on a retry — see SWHR-C-0117's comment.
    const userId = testInfo.retry === 0 ? "dave" : `dave-retry${testInfo.retry}`;

    await addToCart(page, "K9-PO-02");

    await page.goto("/checkout");
    await expect(page).toHaveURL("/signin");

    await signUpAndCompleteRegistration(page, userId, "Secret1");

    await expect(page).toHaveURL("/checkout");
    await expect(
      page.getByRole("navigation", { name: "Global" }).getByRole("button", { name: "Sign out" }),
    ).toBeVisible();
  });

  test("[SWHR-C-0134] first-time visitor signs up from the sign-in screen and can proceed to purchase", async ({
    page,
  }, testInfo) => {
    // Suffixed only on a retry — see SWHR-C-0117's comment.
    const userId = testInfo.retry === 0 ? "frank" : `frank-retry${testInfo.retry}`;

    await addToCart(page, "K9-DL-01");

    await page.goto("/signin");
    await signUpAndCompleteRegistration(page, userId, "Secret1");

    await page.goto("/checkout");
    await expect(page).toHaveURL("/checkout");
    await expect(
      page.getByRole("navigation", { name: "Global" }).getByRole("button", { name: "Sign out" }),
    ).toBeVisible();
  });

  test("[SWHR-C-0135] sign out in Japanese with 3 cart items shows the signed-out page and empties the cart", async ({
    page,
  }, testInfo) => {
    // Suffixed only on a retry — see SWHR-C-0117's comment.
    const userId = testInfo.retry === 0 ? "iris" : `iris-retry${testInfo.retry}`;

    await page.goto("/signin");
    await signUpAndCompleteRegistration(page, userId, "Secret1");

    const japaneseButton = page
      .getByRole("navigation", { name: "Global" })
      .getByRole("button", { name: "日本語" });
    await japaneseButton.click();
    // Wait for the switch to actually land (POST /api/locale resolves and
    // the client state updates) before the hard navigation below — a
    // language button click doesn't block on that, so navigating right
    // after it is a race that can load the product page in the old locale.
    await expect(japaneseButton).toHaveAttribute("aria-pressed", "true");

    // Japanese item name (catalog seed's EST-6 ja_JP details) — the locale
    // switch above means the product page renders in Japanese from here on.
    await addToCart(page, "K9-BD-01", "オス成犬ブルドッグ");
    await addToCart(page, "K9-BD-01", "メス子犬ブルドッグ");
    await addToCart(page, "K9-RT-01", "メス成犬ゴールデンレトリバー");
    await page.goto("/cart");
    await expect(page.getByRole("textbox", { name: /^数量:/ })).toHaveCount(3);

    await page
      .getByRole("navigation", { name: "Global" })
      .getByRole("button", { name: "サインアウト" })
      .click();

    await expect(page).toHaveURL("/signed-out");
    await expect(page.getByRole("heading", { name: "サインアウトしました" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Global" }).getByRole("link", { name: "サインイン" }),
    ).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByText("カートは空です")).toBeVisible();
  });

  test("[SWHR-C-0140] administrator-group member admin_member signing in sees the console", async ({
    page,
  }) => {
    await page.goto("/admin/console");
    await expect(page).toHaveURL("/admin/signin");
    await expect(page.getByRole("heading", { name: "Administration sign-in" })).toBeVisible();

    await page.getByLabel("User ID", { exact: true }).fill("admin_member");
    await page.getByLabel("Password", { exact: true }).fill("admin_member");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/admin/console");
    await expect(page.getByRole("heading", { name: "Administration console" })).toBeVisible();
  });
});
