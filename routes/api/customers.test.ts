import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { customers, groupMembers, profiles, sessions, users } from "../../db/schema";
import { createCredential } from "../../lib/auth/credentials";
import { ACCOUNT_CHANGE_PATH } from "../../lib/auth/protection";
import { getAuthSession, updateAuthSession } from "../../lib/auth/session";
import { getCustomerAccount } from "../../lib/account/customer";
import { validForm } from "../../lib/account/form.fixture";
import postCustomers from "./customers.post";

beforeEach(() => {
  db.delete(customers).run();
  db.delete(profiles).run();
  db.delete(sessions).run();
  // groupMembers.userId references users.userId (FK now enforced) — the
  // dev seed's admin_member row must go before users.
  db.delete(groupMembers).run();
  db.delete(users).run();
});

function cookieFrom(event: H3Event): string {
  return event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
}

function postRequest(body: unknown, cookie?: string): Request {
  return new Request("http://localhost/api/customers", {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

async function pendingRegistration(userId: string, originalUrl: string | null): Promise<H3Event> {
  await createCredential(userId, "Secret1");
  const event = new H3Event(new Request("http://localhost/"));
  await updateAuthSession(event, "storefront", { userId, signedOn: false, originalUrl });
  return event;
}

describe("POST /api/customers", () => {
  /** SWHR-R-0072.02 */
  it("[SWHR-C-0133] redirects to the home page when the originally requested page was the account-change action", async () => {
    const pending = await pendingRegistration("carol", ACCOUNT_CHANGE_PATH);

    const event = new H3Event(postRequest(validForm, cookieFrom(pending)));
    const result = await postCustomers(event);

    expect(result).toEqual({ redirect: "/" });
  });

  // Server half of SWHR-C-0132 (SWHR-T-0048 drives the browser flow).
  it("signs the session on as the registering user and returns to checkout", async () => {
    const pending = await pendingRegistration("dave", "/checkout");

    const event = new H3Event(postRequest(validForm, cookieFrom(pending)));
    const result = await postCustomers(event);

    expect(result).toEqual({ redirect: "/checkout" });

    const session = await getAuthSession(
      new H3Event(new Request("http://localhost/", { headers: { cookie: cookieFrom(event) } })),
      "storefront",
    );
    expect(session).toMatchObject({ userId: "dave", signedOn: true });
  });

  it("creates the customer and profile rows in one transaction", async () => {
    const pending = await pendingRegistration("dave", "/checkout");

    await postCustomers(
      new H3Event(postRequest({ ...validForm, preferredLanguage: "ja_JP" }, cookieFrom(pending))),
    );

    expect(db.select().from(customers).where(eq(customers.userId, "dave")).all()).toHaveLength(1);
    expect(
      db.select().from(profiles).where(eq(profiles.userId, "dave")).get()?.preferredLanguage,
    ).toBe("ja_JP");
  });

  it("[SWHR-C-0217] stores every submitted value on the new customer", async () => {
    const pending = await pendingRegistration("erin", "/checkout");

    await postCustomers(new H3Event(postRequest(validForm, cookieFrom(pending))));

    expect(getCustomerAccount("erin")).toMatchObject({
      status: "active",
      contactInfo: {
        givenName: "ABC",
        familyName: "XYZ",
        telephone: "555-555-5555",
        email: "abc@xyz.com",
        address: {
          streetName1: "1 Main",
          streetName2: "Apt 2",
          city: "Palo Alto",
          state: "California",
          zipCode: "94303",
          country: "United States",
        },
      },
      creditCard: { cardLastFour: "1111", cardType: "Duke Express", expiryDate: "03/2005" },
      profile: {
        preferredLanguage: "en_US",
        favoriteCategory: "DOGS",
        myListPreference: true,
        bannerPreference: true,
      },
    });
  });

  it("rejects an incomplete form with 400, creates nothing and keeps the registration pending", async () => {
    const pending = await pendingRegistration("finn", "/checkout");

    await expect(
      postCustomers(new H3Event(postRequest({ preferredLanguage: "en_US" }, cookieFrom(pending)))),
    ).rejects.toMatchObject({ status: 400, data: { missing: expect.arrayContaining(["city"]) } });

    expect(db.select().from(customers).where(eq(customers.userId, "finn")).all()).toHaveLength(0);
  });

  it("rejects a request with no pending registration", async () => {
    const event = new H3Event(postRequest(validForm));

    await expect(postCustomers(event)).rejects.toMatchObject({ status: 401 });
  });
});
