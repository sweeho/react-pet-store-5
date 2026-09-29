import { expect, type Page, test } from "@playwright/test";

import { completeAccountForm } from "./account-helpers";

/**
 * UI / E2E TEST
 *
 * The cart-to-confirmation journey (swhr-i-0009, design.md P8), in en_US
 * against the throwaway per-run database. Items go in through the API on the
 * page's own request context, so the cart follows the visitor through sign-up.
 */

async function checkOutAs(page: Page, userId: string) {
  for (const itemId of ["EST-6", "EST-1"]) {
    const response = await page.request.post("/api/cart/items", { data: { itemId } });
    expect(response.ok()).toBe(true);
  }
  await page.goto("/cart");
  await page.getByRole("link", { name: /Check Out/ }).click();
  await expect(page).toHaveURL("/signin");

  const form = page.getByRole("form", { name: "I would like to sign up for an account" });
  await form.getByLabel("User name", { exact: true }).fill(userId);
  await form.getByLabel("Password", { exact: true }).fill("Secret1");
  await form.getByLabel("Repeat password").fill("Secret1");
  await form.getByRole("button", { name: "Create New Account" }).click();
  await completeAccountForm(page);
  await expect(page).toHaveURL("/checkout");
}

test.describe("Checkout journey", () => {
  test("[SWHR-C-0257] Check Out with two items opens the order form pre-filled from the account", async ({
    page,
  }, testInfo) => {
    await checkOutAs(page, testInfo.retry === 0 ? "gwen" : `gwen-retry${testInfo.retry}`);

    for (const name of ["Billing Information", "Shipping Information"]) {
      const section = page.getByRole("region", { name });
      await expect(section.getByLabel("First name")).toHaveValue("Maria");
      await expect(section.getByLabel("Last name")).toHaveValue("Chen");
      await expect(section.getByLabel("City")).toHaveValue("Palo Alto");
      await expect(section.getByLabel("State / province")).toHaveValue("California");
      await expect(section.getByLabel("Telephone")).toHaveValue("555-555-5555");
    }
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  });

  test("[SWHR-C-0265] re-submitting the form after a successful order places no second order", async ({
    page,
  }, testInfo) => {
    await checkOutAs(page, testInfo.retry === 0 ? "hana" : `hana-retry${testInfo.retry}`);

    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
    // The account has no e-mail, so the order needs one from the billing section.
    await page
      .getByRole("region", { name: "Billing Information" })
      .getByLabel(/^E-mail/)
      .fill("hana@example.com");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page).toHaveURL("/order-complete");
    await expect(page.getByRole("heading", { name: "Your Order is Complete" })).toBeVisible();
    const first = (await (await page.request.get("/api/orders/last")).json()) as {
      orderId: string;
    };

    await page.goBack();
    await expect(page).toHaveURL("/checkout");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL("/order-error");
    await expect(page.getByRole("heading", { name: "Order Error" })).toBeVisible();
    const second = (await (await page.request.get("/api/orders/last")).json()) as {
      orderId: string;
    };
    expect(second.orderId).toBe(first.orderId);
  });
});
