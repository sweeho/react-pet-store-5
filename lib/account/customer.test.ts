import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { db } from "../../db/client";
import {
  accounts,
  addresses,
  contactInfos,
  creditCards,
  customers,
  profiles,
  users,
} from "../../db/schema";
import { createAccount, createCustomer, getCustomerAccount, listCustomers } from "./customer";
import type { ContactInfoValue, CreditCardValue } from "./types";

beforeEach(() => {
  db.delete(customers).run();
  db.delete(users).where(eq(users.passwordHash, "x")).run();
});

function addUser(userId: string) {
  db.insert(users).values({ userId, passwordHash: "x" }).run();
}

const emptyAddress = {
  streetName1: "",
  streetName2: null,
  city: "",
  state: "",
  zipCode: "",
  country: "",
};

describe("customer creation", () => {
  test("[SWHR-C-0193] creating customer j2ee yields one customer, one account, one profile", () => {
    addUser("j2ee");
    createCustomer("j2ee");
    for (const table of [customers, accounts, profiles]) {
      expect(db.select().from(table).where(eq(table.userId, "j2ee")).all()).toHaveLength(1);
    }
  });

  test("[SWHR-C-0195] account of a new customer is active with one contact and one card", () => {
    addUser("carol");
    createCustomer("carol");
    const account = db.select().from(accounts).where(eq(accounts.userId, "carol")).get();
    expect(account?.status).toBe("active");
    const id = account?.id ?? -1;
    expect(db.select().from(contactInfos).where(eq(contactInfos.accountId, id)).all()).toHaveLength(
      1,
    );
    expect(db.select().from(creditCards).where(eq(creditCards.accountId, id)).all()).toHaveLength(
      1,
    );
  });

  test("[SWHR-C-0204] new customer has an active account with empty contact, address and card", () => {
    addUser("newbie");
    createCustomer("newbie");
    expect(getCustomerAccount("newbie")).toEqual({
      userId: "newbie",
      status: "active",
      contactInfo: {
        givenName: "",
        familyName: "",
        telephone: "",
        email: "",
        address: emptyAddress,
      },
      creditCard: { cardLastFour: "", cardType: "", expiryDate: null },
      profile: {
        preferredLanguage: "en_US",
        favoriteCategory: null,
        myListPreference: true,
        bannerPreference: true,
      },
    });
  });

  test("[SWHR-C-0205] new customer's profile has default preferences", () => {
    addUser("prefs");
    createCustomer("prefs");
    expect(getCustomerAccount("prefs")?.profile).toEqual({
      preferredLanguage: "en_US",
      favoriteCategory: null,
      myListPreference: true,
      bannerPreference: true,
    });
  });

  test("[SWHR-C-0206] failed profile creation rolls back all newbie records", () => {
    addUser("rollback");
    const before = {
      contacts: db.select().from(contactInfos).all().length,
      addresses: db.select().from(addresses).all().length,
      cards: db.select().from(creditCards).all().length,
    };
    const original = db.transaction.bind(db) as typeof db.transaction;
    const spy = vi.spyOn(db, "transaction").mockImplementation(((fn: (tx: never) => unknown) =>
      original((tx) => {
        const insert = tx.insert.bind(tx) as typeof tx.insert;
        tx.insert = ((table: unknown) => {
          if (table === profiles) throw new Error("profile insert failed");
          return insert(table as never);
        }) as typeof tx.insert;
        return fn(tx as never);
      })) as typeof db.transaction);
    try {
      expect(() => createCustomer("rollback")).toThrow("profile insert failed");
    } finally {
      spy.mockRestore();
    }
    expect(db.select().from(customers).where(eq(customers.userId, "rollback")).all()).toHaveLength(
      0,
    );
    expect(db.select().from(accounts).where(eq(accounts.userId, "rollback")).all()).toHaveLength(0);
    expect(db.select().from(profiles).where(eq(profiles.userId, "rollback")).all()).toHaveLength(0);
    expect(db.select().from(contactInfos).all()).toHaveLength(before.contacts);
    expect(db.select().from(addresses).all()).toHaveLength(before.addresses);
    expect(db.select().from(creditCards).all()).toHaveLength(before.cards);
  });
});

describe("customer lookups and seeded accounts", () => {
  test("[SWHR-C-0208] lookup by user id ACID returns the ACID customer", () => {
    for (const id of ["j2ee", "ACID"]) {
      addUser(id);
      createCustomer(id);
    }
    expect(getCustomerAccount("ACID")?.userId).toBe("ACID");
    expect(getCustomerAccount("nobody")).toBeNull();
  });

  test("[SWHR-C-0209] listing all customers returns j2ee and ACID", () => {
    for (const id of ["j2ee", "ACID"]) {
      addUser(id);
      createCustomer(id);
    }
    expect([...listCustomers()].sort()).toEqual(["ACID", "j2ee"]);
  });

  test("[SWHR-C-0210] account created from supplied status, contact and card carries exactly them", () => {
    addUser("seeded");
    db.insert(customers).values({ userId: "seeded", createdAt: new Date() }).run();
    db.insert(profiles).values({ userId: "seeded" }).run();
    const contactInfo: ContactInfoValue = {
      givenName: "ABC",
      familyName: "XYZ",
      telephone: "555-555-5555",
      email: "abc@example.com",
      address: {
        streetName1: "1 Main",
        streetName2: null,
        city: "Palo Alto",
        state: "California",
        zipCode: "94303",
        country: "United States",
      },
    };
    const creditCard: CreditCardValue = {
      cardLastFour: "1111",
      cardType: "Duke Express",
      expiryDate: "07/2004",
    };
    createAccount("seeded", { status: "active", contactInfo, creditCard });
    const account = getCustomerAccount("seeded");
    expect(account?.status).toBe("active");
    expect(account?.contactInfo).toEqual(contactInfo);
    expect(account?.creditCard).toEqual(creditCard);
  });
});
