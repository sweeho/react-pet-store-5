import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { db } from "../../db/client";
import * as schema from "../../db/schema";

// The tables are read off the namespace so a missing export fails an
// assertion here rather than an import.
function tables() {
  const { users, customers, profiles, accounts, contactInfos, addresses, creditCards } = schema;
  for (const t of [accounts, contactInfos, addresses, creditCards]) expect(t).toBeDefined();
  return { users, customers, profiles, accounts, contactInfos, addresses, creditCards };
}

function seedCustomer(userId: string) {
  const t = tables();
  db.insert(t.users).values({ userId, passwordHash: "x" }).run();
  db.insert(t.customers).values({ userId, createdAt: new Date() }).run();
  db.insert(t.profiles).values({ userId }).run();
  return db.insert(t.accounts).values({ userId }).returning().get();
}

const address = {
  streetName1: "1 Main",
  streetName2: "Apt 2",
  city: "Palo Alto",
  state: "CA",
  zipCode: "94303",
  country: "USA",
};

describe("customer account data model", () => {
  test("[SWHR-C-0194] second customer for j2ee is refused and the first is unchanged", () => {
    const t = tables();
    const account = seedCustomer("j2ee");
    db.insert(t.contactInfos).values({ accountId: account.id, telephone: "555-555-5555" }).run();
    const snapshot = {
      customers: db.select().from(t.customers).where(eq(t.customers.userId, "j2ee")).all(),
      accounts: db.select().from(t.accounts).where(eq(t.accounts.userId, "j2ee")).all(),
      profiles: db.select().from(t.profiles).where(eq(t.profiles.userId, "j2ee")).all(),
    };

    expect(() =>
      db.insert(t.customers).values({ userId: "j2ee", createdAt: new Date() }).run(),
    ).toThrow();
    expect(() => db.insert(t.accounts).values({ userId: "j2ee" }).run()).toThrow();

    expect(db.select().from(t.customers).where(eq(t.customers.userId, "j2ee")).all()).toEqual(
      snapshot.customers,
    );
    expect(db.select().from(t.accounts).where(eq(t.accounts.userId, "j2ee")).all()).toEqual(
      snapshot.accounts,
    );
    expect(db.select().from(t.profiles).where(eq(t.profiles.userId, "j2ee")).all()).toEqual(
      snapshot.profiles,
    );
  });

  test("[SWHR-C-0196] contact information round-trips with its postal address", () => {
    const t = tables();
    const account = seedCustomer("rt-user");
    const contact = db
      .insert(t.contactInfos)
      .values({
        accountId: account.id,
        givenName: "ABC",
        familyName: "XYZ",
        telephone: "555-555-5555",
        email: "abc@xyz.com",
      })
      .returning()
      .get();
    db.insert(t.addresses)
      .values({ contactInfoId: contact.id, ...address })
      .run();

    const read = db.select().from(t.contactInfos).where(eq(t.contactInfos.id, contact.id)).get();
    const addr = db
      .select()
      .from(t.addresses)
      .where(eq(t.addresses.contactInfoId, contact.id))
      .get();
    expect(read).toMatchObject({
      givenName: "ABC",
      familyName: "XYZ",
      telephone: "555-555-5555",
      email: "abc@xyz.com",
    });
    expect(addr).toMatchObject(address);
  });

  test("[SWHR-C-0197] two identical addresses are stored as distinct records", () => {
    const t = tables();
    const a = db.insert(t.addresses).values(address).returning().get();
    const b = db.insert(t.addresses).values(address).returning().get();
    expect(a.id).not.toBe(b.id);
    expect(db.select().from(t.addresses).where(eq(t.addresses.id, a.id)).all()).toHaveLength(1);
    expect(db.select().from(t.addresses).where(eq(t.addresses.id, b.id)).all()).toHaveLength(1);
  });

  test("[SWHR-C-0198] address with no second street line stores without error", () => {
    const t = tables();
    const withoutStreet2 = { ...address, streetName2: undefined };
    const row = db.insert(t.addresses).values(withoutStreet2).returning().get();
    expect(row.streetName2).toBeNull();
  });

  test("[SWHR-C-0199] two card records with the same number both exist", () => {
    const t = tables();
    const first = db
      .insert(t.creditCards)
      .values({ cardLastFour: "1111", cardType: "Duke Express" })
      .returning()
      .get();
    const second = db
      .insert(t.creditCards)
      .values({ cardLastFour: "1111", cardType: "Duke Express" })
      .returning()
      .get();
    expect(first.id).not.toBe(second.id);
    expect(
      db.select().from(t.creditCards).where(eq(t.creditCards.cardLastFour, "1111")).all(),
    ).toHaveLength(2);
    expect(Object.keys(first)).not.toContain("cardNumber");
  });

  test("[SWHR-C-0207] deleting a customer removes all six related records", () => {
    const t = tables();
    const account = seedCustomer("del-user");
    const contact = db.insert(t.contactInfos).values({ accountId: account.id }).returning().get();
    const addr = db
      .insert(t.addresses)
      .values({ contactInfoId: contact.id, ...address })
      .returning()
      .get();
    const card = db
      .insert(t.creditCards)
      .values({ accountId: account.id, cardLastFour: "1111" })
      .returning()
      .get();

    db.delete(t.customers).where(eq(t.customers.userId, "del-user")).run();

    const gone = [
      db.select().from(t.customers).where(eq(t.customers.userId, "del-user")).all(),
      db.select().from(t.profiles).where(eq(t.profiles.userId, "del-user")).all(),
      db.select().from(t.accounts).where(eq(t.accounts.id, account.id)).all(),
      db.select().from(t.contactInfos).where(eq(t.contactInfos.id, contact.id)).all(),
      db.select().from(t.addresses).where(eq(t.addresses.id, addr.id)).all(),
      db.select().from(t.creditCards).where(eq(t.creditCards.id, card.id)).all(),
    ];
    for (const rows of gone) expect(rows).toEqual([]);
  });
});
