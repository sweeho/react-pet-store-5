import { expect, type Page, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * The supplier inventory journey (swhr-i-0012): home, inventory update,
 * confirmation and logout. Other specs order EST-1 and EST-6 in parallel, so
 * stock is never set below 10 here.
 */

async function signInAsSupplier(page: Page): Promise<void> {
  await page.goto("/supplier");
  await expect(page).toHaveURL("/supplier/signin");
  await page.getByLabel("User ID", { exact: true }).fill("supplier");
  await page.getByLabel("Password", { exact: true }).fill("supplier");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/supplier");
}

function row(page: Page, itemId: string) {
  return page.getByRole("row").filter({ has: page.getByText(itemId, { exact: true }) });
}

async function submitBatch(
  page: Page,
  entries: { itemId: string; quantity: string; update: boolean }[],
): Promise<void> {
  await page.goto("/supplier/inventory");
  for (const { itemId, quantity, update } of entries) {
    await row(page, itemId).getByRole("textbox").fill(quantity);
    if (update) await row(page, itemId).getByRole("checkbox").check();
  }
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page).toHaveURL("/supplier/updated");
}

test.describe("Supplier inventory journey", () => {
  test("[SWHR-C-0405] Display Inventory on home opens the inventory update screen", async ({
    page,
  }) => {
    await signInAsSupplier(page);

    await page.getByRole("link", { name: "Display Inventory" }).click();

    await expect(page).toHaveURL("/supplier/inventory");
    await expect(page.getByRole("heading", { name: "Inventory" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  });

  test("[SWHR-C-0408] Submit applies ticked EST-1 = 50 and ignores unticked EST-2 = 60", async ({
    page,
  }) => {
    await signInAsSupplier(page);
    await submitBatch(page, [
      { itemId: "EST-1", quantity: "10", update: true },
      { itemId: "EST-2", quantity: "10", update: true },
    ]);

    await submitBatch(page, [
      { itemId: "EST-1", quantity: "50", update: true },
      { itemId: "EST-2", quantity: "60", update: false },
    ]);

    await expect(page.getByText(/updated successfully/)).toBeVisible();
    const { items } = (await (await page.request.get("/api/supplier/inventory")).json()) as {
      items: { itemId: string; quantity: number }[];
    };
    expect(items.find((i) => i.itemId === "EST-1")?.quantity).toBe(50);
    expect(items.find((i) => i.itemId === "EST-2")?.quantity).toBe(10);
  });

  test("[SWHR-C-0412] Display Inventory from confirmation shows EST-1 at 50", async ({ page }) => {
    await signInAsSupplier(page);
    await submitBatch(page, [{ itemId: "EST-1", quantity: "50", update: true }]);

    await page.getByRole("link", { name: "Display Inventory" }).click();

    await expect(page).toHaveURL("/supplier/inventory");
    await expect(row(page, "EST-1").getByText("50", { exact: true })).toBeVisible();
  });

  test("[SWHR-C-0406] Logout on supplier home ends the session and offers re-entry", async ({
    page,
  }) => {
    await signInAsSupplier(page);

    await page.getByRole("button", { name: "Logout" }).click();

    await expect(page).toHaveURL("/supplier/signed-out");
    await expect(page.getByRole("link", { name: "Return to supplier sign-in" })).toBeVisible();
    await page.goto("/supplier/inventory");
    await expect(page).toHaveURL("/supplier/signin");
  });
});
