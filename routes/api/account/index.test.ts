import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { creditCards, customers, groupMembers, sessions, users } from "../../../db/schema";
import { createCustomer, getCustomerAccount } from "../../../lib/account/customer";
import type { AccountFormInput } from "../../../lib/account/form";
import { createCredential } from "../../../lib/auth/credentials";
import { updateAuthSession } from "../../../lib/auth/session";
import getAccount from "./index.get";
import putAccount from "./index.put";

const validForm: AccountFormInput = {
  givenName: "ABC",
  familyName: "XYZ",
  telephone: "555-555-5555",
  email: "abc@xyz.com",
  streetName1: "1 Main",
  streetName2: "Apt 2",
  city: "Palo Alto",
  state: "California",
  zipCode: "94303",
  country: "United States",
  cardNumber: "4111-1111-1111-1111",
  cardType: "Duke Express",
  expiryMonth: "03",
  expiryYear: "2005",
  preferredLanguage: "en_US",
  favoriteCategory: "DOGS",
  myListPreference: true,
  bannerPreference: true,
};

beforeEach(() => {
  db.delete(customers).run();
  db.delete(sessions).run();
  db.delete(groupMembers).run();
  db.delete(users).run();
});

function cookieFrom(event: H3Event): string {
  return event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
}

async function signedOn(userId: string, withCustomer = true): Promise<string> {
  await createCredential(userId, "Secret1");
  if (withCustomer) createCustomer(userId);
  const event = new H3Event(new Request("http://localhost/"));
  await updateAuthSession(event, "storefront", { userId, signedOn: true });
  return cookieFrom(event);
}

function put(body: unknown, cookie?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/account", {
      method: "PUT",
      headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
    }),
  );
}

function get(cookie?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/account", { headers: cookie ? { cookie } : {} }),
  );
}

describe("/api/account", () => {
  it("[SWHR-C-0218] edit changes city to San Jose and stores the other values as submitted", async () => {
    const cookie = await signedOn("edith");
    await putAccount(put(validForm, cookie));

    const view = await putAccount(put({ ...validForm, city: "San Jose", cardNumber: "" }, cookie));

    const stored = getCustomerAccount("edith");
    expect(stored?.contactInfo.address).toMatchObject({
      city: "San Jose",
      streetName1: "1 Main",
      state: "California",
    });
    expect(stored?.contactInfo).toMatchObject({ givenName: "ABC", telephone: "555-555-5555" });
    expect(stored?.creditCard.cardLastFour).toBe("1111");
    expect(view).toMatchObject({ creditCard: { cardNumberMasked: "•••• •••• •••• 1111" } });
    expect(await getAccount(get(cookie))).toMatchObject({ userId: "edith" });
  });

  it("[SWHR-C-0201] stores expiry 03/2005 from the submitted month and year", async () => {
    const cookie = await signedOn("expy");
    await putAccount(put(validForm, cookie));
    const card = db.select().from(creditCards).all();
    expect(card.map((c) => c.expiryDate)).toContain("03/2005");
  });

  it("[SWHR-C-0219] rejects a city of only spaces with 400 naming city and saves nothing", async () => {
    const cookie = await signedOn("cityless");
    await expect(putAccount(put({ ...validForm, city: "   " }, cookie))).rejects.toMatchObject({
      status: 400,
      data: { missing: ["city"] },
    });
    expect(getCustomerAccount("cityless")?.contactInfo.address.city).toBe("");
  });

  it("[SWHR-C-0220] saves blank street line 2 and no email as absent", async () => {
    const cookie = await signedOn("optional");
    await putAccount(put({ ...validForm, email: undefined, streetName2: "" }, cookie));
    const stored = getCustomerAccount("optional");
    expect(stored?.contactInfo.address.streetName2).toBeNull();
    expect(stored?.contactInfo.email).toBe("");
  });

  it("[SWHR-C-0221] stores unticked My List and banner as off", async () => {
    const cookie = await signedOn("unticked");
    await putAccount(
      put({ ...validForm, myListPreference: undefined, bannerPreference: undefined }, cookie),
    );
    expect(getCustomerAccount("unticked")?.profile).toMatchObject({
      myListPreference: false,
      bannerPreference: false,
    });
  });

  it("[SWHR-C-0222] rejects a missing favourite category and saves nothing", async () => {
    const cookie = await signedOn("nofav");
    await expect(
      putAccount(put({ ...validForm, favoriteCategory: undefined }, cookie)),
    ).rejects.toMatchObject({
      status: 400,
      data: { missing: ["favoriteCategory"] },
    });
    expect(getCustomerAccount("nofav")?.profile.favoriteCategory).toBeNull();
  });

  it("acts only on the session's own customer, whatever the body says", async () => {
    const cookie = await signedOn("mine");
    await signedOn("theirs");
    await putAccount(put({ ...validForm, userId: "theirs", city: "Mine City" }, cookie));
    expect(getCustomerAccount("mine")?.contactInfo.address.city).toBe("Mine City");
    expect(getCustomerAccount("theirs")?.contactInfo.address.city).toBe("");
    expect(db.select().from(customers).where(eq(customers.userId, "theirs")).all()).toHaveLength(1);
  });

  it("refuses both requests without a signed-on session with 401", async () => {
    await expect(getAccount(get())).rejects.toMatchObject({ status: 401 });
    await expect(putAccount(put(validForm))).rejects.toMatchObject({ status: 401 });
  });

  it("answers 404 to a signed-on user without a customer", async () => {
    const cookie = await signedOn("nobody", false);
    await expect(getAccount(get(cookie))).rejects.toMatchObject({ status: 404 });
  });
});
