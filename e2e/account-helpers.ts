import { expect, type Page } from "@playwright/test";

/** Fills the /register account form with valid values and submits it. */
export async function completeAccountForm(page: Page) {
  await expect(page).toHaveURL("/register");
  await page.getByLabel("First Name").fill("Maria");
  await page.getByLabel("Last Name").fill("Chen");
  await page.getByLabel("Street Address", { exact: true }).fill("1400 Page Mill Road");
  await page.getByLabel("City").fill("Palo Alto");
  await page.getByLabel("State / Province").selectOption("California");
  await page.getByLabel("Postal Code").fill("94304");
  await page.getByLabel("Country").selectOption("United States");
  await page.getByLabel("Telephone Number").fill("555-555-5555");
  await page.getByLabel("Card Number").fill("4111-1111-1111-1111");
  await page.getByLabel("Card Type").selectOption("Duke Express");
  await page.getByLabel("Expiry Month").selectOption("07");
  await page.getByLabel("Expiry Year").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Finish creating my account" }).click();
}

/** Signs up through the sign-in page's new-account form, then completes registration. */
export async function signUp(page: Page, userId: string, password: string) {
  const newAccountForm = page.getByRole("form", { name: "I would like to sign up for an account" });
  await newAccountForm.getByLabel("User name", { exact: true }).fill(userId);
  await newAccountForm.getByLabel("Password", { exact: true }).fill(password);
  await newAccountForm.getByLabel("Repeat password").fill(password);
  await newAccountForm.getByRole("button", { name: "Create New Account" }).click();
  await completeAccountForm(page);
}
