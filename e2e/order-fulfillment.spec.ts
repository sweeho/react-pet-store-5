import { expect, type Page, test } from "@playwright/test";

import { completeAccountForm, signInAsAdmin } from "./account-helpers";

/**
 * UI / E2E TEST
 *
 * The checkout-to-COMPLETED journey (swhr-i-0011): an en_US order under 500 is
 * auto-approved, sent to the supplier, shipped from the seeded stock and
 * invoiced back, all through the real queue workers. The administrator views
 * are polled because every hop is asynchronous. SWHR-C-0385 (stock update
 * from the supplier inventory surface) waits on swhr-i-0012 and is proven at
 * integration level in lib/b2b/scenarios/order-fulfillment.test.ts.
 */

async function placeEnUsOrder(page: Page, userId: string): Promise<string> {
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

  // Intake rejects a blank e-mail, which would leave the order unstored.
  const emailFields = page.getByLabel(/^E-mail/);
  await expect(emailFields).toHaveCount(2);
  for (const field of await emailFields.all()) {
    await field.fill(`${userId}@example.com`);
  }
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page).toHaveURL("/order-complete");
  await expect(page.getByRole("heading", { name: "Your Order is Complete" })).toBeVisible();

  const last = (await (await page.request.get("/api/orders/last")).json()) as { orderId: string };
  return last.orderId;
}

test.describe("Order fulfilment journey", () => {
  test("[SWHR-C-0340] an approved order flows to the supplier and is invoiced back to COMPLETED", async ({
    page,
  }, testInfo) => {
    const orderId = await placeEnUsOrder(
      page,
      testInfo.retry === 0 ? "fulfil-shopper" : `fulfil-shopper-retry${testInfo.retry}`,
    );

    const admin = await page.context().browser()!.newPage();
    await signInAsAdmin(admin);

    await expect
      .poll(
        async () => {
          const response = await admin.request.post("/api/admin/order-data", {
            data: { type: "GETORDERS", status: "COMPLETED" },
          });
          const body = (await response.json()) as { orders?: { orderId: string }[] };
          return (body.orders ?? []).some((o) => o.orderId === orderId);
        },
        { timeout: 30_000 },
      )
      .toBe(true);

    const supplier = (await (await admin.request.get("/api/admin/orders")).json()) as {
      orders: { orderId: string; status: string }[];
    };
    expect(supplier.orders.find((o) => o.orderId === orderId)?.status).toBe("COMPLETED");
  });
});
