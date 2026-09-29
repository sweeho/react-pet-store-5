import { expect, type Page, test } from "@playwright/test";

import { placeZhCnOrder, signInAsAdmin } from "./account-helpers";

/**
 * UI / E2E TEST
 *
 * The order-approval journeys (swhr-i-0010, design.md P8) against the real
 * server and outbox dispatcher, on the per-run throwaway database. Each test
 * places its own zh_CN order (which always waits as PENDING) and finds it by
 * id, since tests share one database under `fullyParallel`.
 */

const userFor = (prefix: string, retry: number) =>
  retry === 0 ? prefix : `${prefix}-retry${retry}`;

async function launchWorkspace(page: Page) {
  await page.getByRole("button", { name: "Launch Rich Client" }).click();
  await expect(page).toHaveURL("/admin/orders");
  await expect(page.getByRole("heading", { name: "Pet Store Administration" })).toBeVisible();
}

/** Intake stores the order asynchronously, so refresh until it is listed as pending. */
async function waitForPending(admin: Page, orderId: string) {
  await expect(async () => {
    await admin.getByRole("button", { name: "Refresh" }).click();
    await expect(admin.getByLabel(`Status of order ${orderId}`)).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 20_000 });
}

/** A fresh browser context signs in as the administrator, so the shopper session is untouched. */
async function adminPage(page: Page): Promise<Page> {
  const admin = await page.context().browser()!.newPage();
  await signInAsAdmin(admin);
  return admin;
}

test.describe("Order approval journeys", () => {
  test("[SWHR-C-0324] Launch Rich Client on the console opens the order-management workspace", async ({
    page,
  }) => {
    await signInAsAdmin(page);

    await launchWorkspace(page);
  });

  test("[SWHR-C-0325] logout on the console signs the administrator out", async ({ page }) => {
    await signInAsAdmin(page);

    await page.getByRole("button", { name: "logout" }).click();

    await expect(page).toHaveURL("/admin");
    await page.goto("/admin/console");
    await expect(page).toHaveURL("/admin/signin");
  });

  test("[SWHR-C-0300] closing the client with an uncommitted approval leaves the order PENDING", async ({
    page,
  }, testInfo) => {
    const orderId = await placeZhCnOrder(page, userFor("pending-shopper", testInfo.retry));
    const admin = await adminPage(page);
    await launchWorkspace(admin);
    await waitForPending(admin, orderId);

    await admin.getByLabel(`Status of order ${orderId}`).selectOption("APPROVED");
    await admin.getByRole("button", { name: "Exit" }).click();
    await expect(admin).toHaveURL("/admin/console");
    await launchWorkspace(admin);

    await expect(admin.getByLabel(`Status of order ${orderId}`)).toHaveValue("PENDING");
  });

  test("[SWHR-C-0327] a committed approval leaves the pending list and shows as non-pending after refresh", async ({
    page,
  }, testInfo) => {
    const orderId = await placeZhCnOrder(page, userFor("approve-shopper", testInfo.retry));
    const admin = await adminPage(page);
    await launchWorkspace(admin);
    await waitForPending(admin, orderId);

    await admin.getByLabel(`Status of order ${orderId}`).selectOption("APPROVED");
    await admin.getByRole("button", { name: "Commit decisions" }).click();

    // The dispatcher applies the decision asynchronously; refresh until it lands.
    await expect(async () => {
      await admin.getByRole("button", { name: "Refresh" }).click();
      await expect(admin.getByLabel(`Status of order ${orderId}`)).toHaveCount(0, {
        timeout: 1_000,
      });
    }).toPass({ timeout: 20_000 });

    await admin.getByRole("tab", { name: /View Non-Pending Orders/ }).click();
    const row = admin.getByRole("row", { name: `Order ${orderId}` });
    await expect(row).toBeVisible();
    await expect(row).toContainText("APPROVED");
  });

  test("Sales bar chart reloads for a new range and rejects a malformed date", async ({
    page,
  }, testInfo) => {
    await placeZhCnOrder(page, userFor("sales-shopper", testInfo.retry));
    const admin = await adminPage(page);
    await launchWorkspace(admin);

    await admin.getByRole("tab", { name: "Sales" }).click();
    await admin.getByRole("tab", { name: "Bar Chart" }).click();
    await admin.getByLabel("Start Date").fill("01/01/2001");
    await admin.getByLabel("End Date").fill("12/31/2099");
    // Intake is asynchronous: reload the range until the order's category shows.
    await expect(async () => {
      await admin.getByRole("button", { name: "Get Data" }).click();
      await expect(admin.getByRole("cell", { name: "Fish", exact: true })).toBeVisible({
        timeout: 1_000,
      });
    }).toPass({ timeout: 20_000 });

    await admin.getByLabel("Start Date").fill("2001-01-01");
    await admin.getByRole("button", { name: "Get Data" }).click();
    await expect(admin.getByText("Dates must be in the format of MM/dd/yyyy")).toBeVisible();
  });
});
