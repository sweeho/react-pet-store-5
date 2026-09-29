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

/** Signs in to the administration realm as the seeded administrator and lands on the console. */
export async function signInAsAdmin(page: Page): Promise<void> {
  await page.goto("/admin/console");
  await expect(page).toHaveURL("/admin/signin");
  await page.getByLabel("User ID", { exact: true }).fill("admin_member");
  await page.getByLabel("Password", { exact: true }).fill("admin_member");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/admin/console");
}

/**
 * Registers `userId`, switches the session to 中文 and submits a two-item
 * checkout, so the order stays PENDING (no zh_CN auto-approval). Returns the
 * new order id.
 */
export async function placeZhCnOrder(page: Page, userId: string): Promise<string> {
  for (const itemId of ["EST-6", "EST-1"]) {
    const response = await page.request.post("/api/cart/items", { data: { itemId } });
    expect(response.ok()).toBe(true);
  }
  await page.goto("/cart");
  await page.getByRole("link", { name: /Check Out/ }).click();
  await expect(page).toHaveURL("/signin");
  await signUp(page, userId, "Secret1");
  await expect(page).toHaveURL("/checkout");

  const switched = await page.request.post("/api/locale", { data: { locale: "zh_CN" } });
  expect(switched.ok()).toBe(true);
  await page.goto("/checkout");
  // Intake rejects a blank e-mail, which would leave the order unstored.
  const emailFields = page.getByLabel("电子邮件");
  await expect(emailFields).toHaveCount(2);
  for (const field of await emailFields.all()) {
    await field.fill(`${userId}@example.com`);
  }
  await page.getByRole("button", { name: "提交" }).click();
  await expect(page).toHaveURL("/order-complete");

  const last = (await (await page.request.get("/api/orders/last")).json()) as { orderId: string };
  return last.orderId;
}
