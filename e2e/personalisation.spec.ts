import { expect, test } from "@playwright/test";

import { signUp } from "./account-helpers";

test.describe("Personalisation", () => {
  test("My List and the pet-tips banner follow the profile preferences", async ({
    page,
  }, testInfo) => {
    const userId = testInfo.retry === 0 ? "gina" : `gina-retry${testInfo.retry}`;
    await page.goto("/signin");
    await signUp(page, userId, "Secret1");

    // Registration leaves both preferences on; make the favourite category Fish.
    await page.goto("/account-edit");
    await page.getByLabel("My favourite category").selectOption("FISH");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page).toHaveURL("/account");

    await page.goto("/");
    const myList = page.getByRole("navigation", { name: "My List · Fish" });
    await expect(myList).toBeVisible();
    await expect(myList.getByRole("link", { name: "Angelfish" })).toBeVisible();
    await expect(
      page.getByText("Change about a quarter of the aquarium water every two weeks."),
    ).toBeVisible();

    await page.goto("/account-edit");
    await page.getByLabel("Enable My List").uncheck();
    await page.getByLabel("Enable pet tips banners").uncheck();
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page).toHaveURL("/account");

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Pets" }).first()).toBeVisible();
    await expect(page.getByRole("navigation", { name: /^My List/ })).toHaveCount(0);
    await expect(
      page.getByText("Change about a quarter of the aquarium water every two weeks."),
    ).toHaveCount(0);
  });
});
