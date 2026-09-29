import { expect, test } from "@playwright/test";

import { signUp } from "./account-helpers";

// A stored account with card expiry 07/2004, My List on and banners off. The
// creation form only offers current-year expiries, so the stored values come
// from the account update route the edit form itself posts to.
async function signUpWithStoredAccount(
  page: Parameters<typeof signUp>[0],
  userId: string,
  retry: number,
) {
  const name = retry === 0 ? userId : `${userId}-retry${retry}`;
  await page.goto("/signin");
  await signUp(page, name, "Secret1");
  const response = await page.request.put("/api/account", {
    data: {
      givenName: "Maria",
      familyName: "Chen",
      streetName1: "1400 Page Mill Road",
      streetName2: "Suite 210",
      city: "Palo Alto",
      state: "California",
      zipCode: "94304",
      country: "United States",
      telephone: "555-555-5555",
      email: "maria@example.com",
      cardNumber: "",
      cardType: "Duke Express",
      expiryMonth: "07",
      expiryYear: "2004",
      preferredLanguage: "en_US",
      favoriteCategory: "CATS",
      myListPreference: true,
      bannerPreference: false,
    },
  });
  expect(response.ok()).toBe(true);
}

test.describe("Account journeys", () => {
  test("[SWHR-C-0230] account page shows stored fields, expiry 07/2004, My List Yes, banners No", async ({
    page,
  }, testInfo) => {
    await signUpWithStoredAccount(page, "carol", testInfo.retry);
    await page.goto("/account");

    const value = (label: string) =>
      page.locator("dt", { hasText: new RegExp(`^${label}$`) }).locator("xpath=..");
    await expect(value("First Name")).toContainText("Maria");
    await expect(value("E-mail")).toContainText("maria@example.com");
    await expect(value("Card Type")).toContainText("Duke Express");
    await expect(value("Card Number")).toContainText("•••• •••• •••• 1111");
    await expect(value("Expiry Month")).toContainText("07");
    await expect(value("Expiry Year")).toContainText("2004");
    await expect(value("Preferred Language")).toContainText("English (en_US)");
    await expect(value("Favourite Category")).toContainText("Cats");
    await expect(value("My List")).toContainText("Yes");
    await expect(value("Pet Tips Banners")).toContainText("No");
  });

  test("[SWHR-C-0231] the edit control opens the edit form preselected with stored values", async ({
    page,
  }, testInfo) => {
    await signUpWithStoredAccount(page, "dora", testInfo.retry);
    await page.goto("/account");
    await page.getByRole("link", { name: "Edit Your Account Information" }).click();

    await expect(page).toHaveURL("/account-edit");
    await expect(page.getByLabel("First Name")).toHaveValue("Maria");
    await expect(page.getByLabel("Card Number")).toHaveValue("•••• •••• •••• 1111");
    await expect(page.getByLabel("Card Type")).toHaveValue("Duke Express");
    await expect(page.getByLabel("Expiry Year")).toHaveValue("2004");
    await expect(page.getByLabel("My favourite category")).toHaveValue("CATS");
  });
});
