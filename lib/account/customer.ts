import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import {
  accounts,
  addresses,
  contactInfos,
  creditCards,
  customers,
  profiles,
} from "../../db/schema";
import { createContactInfoFromValue, createEmptyContactInfo, getContactInfo } from "./contactInfo";
import type {
  AccountStatus,
  ContactInfoValue,
  CreditCardValue,
  CustomerAccount,
  Executor,
  Tx,
} from "./types";

function isAccountStatus(status: string): status is AccountStatus {
  return status === "active" || status === "disabled";
}

// Customer, active account, empty contact + address + card and the default
// profile are written in one transaction (R-0115..R-0117); a caller's `tx`
// joins its unit of work. Throws when the user id already has a customer.
export function createCustomer(userId: string, tx?: Tx): void {
  const run = (t: Tx) => {
    t.insert(customers).values({ userId, createdAt: new Date() }).run();
    const account = t.insert(accounts).values({ userId, status: "active" }).returning().get();
    createEmptyContactInfo(t, account.id);
    t.insert(creditCards).values({ accountId: account.id }).run();
    t.insert(profiles).values({ userId }).run();
  };
  if (tx) run(tx);
  else db.transaction(run);
}

// Seeded account (R-0120) for an existing customer that has none yet.
export function createAccount(
  userId: string,
  value: { status: AccountStatus; contactInfo: ContactInfoValue; creditCard: CreditCardValue },
  tx: Executor = db,
): number {
  const account = tx
    .insert(accounts)
    .values({ userId, status: value.status })
    .returning({ id: accounts.id })
    .get();
  createContactInfoFromValue(value.contactInfo, tx, account.id);
  tx.insert(creditCards)
    .values({ accountId: account.id, ...value.creditCard })
    .run();
  return account.id;
}

// A detached copy of the whole account graph, or null without a customer.
export function getCustomerAccount(userId: string): CustomerAccount | null {
  const account = db.select().from(accounts).where(eq(accounts.userId, userId)).get();
  const profile = db.select().from(profiles).where(eq(profiles.userId, userId)).get();
  if (!account || !profile || !isAccountStatus(account.status)) return null;
  const contact = db
    .select({ id: contactInfos.id })
    .from(contactInfos)
    .where(eq(contactInfos.accountId, account.id))
    .get();
  const card = db.select().from(creditCards).where(eq(creditCards.accountId, account.id)).get();
  const contactInfo = contact ? getContactInfo(contact.id) : null;
  if (!contactInfo || !card) return null;
  return {
    userId,
    status: account.status,
    contactInfo,
    creditCard: {
      cardLastFour: card.cardLastFour,
      cardType: card.cardType,
      expiryDate: card.expiryDate,
    },
    profile: {
      preferredLanguage: profile.preferredLanguage,
      favoriteCategory: profile.favoriteCategory,
      myListPreference: profile.myListPreference,
      bannerPreference: profile.bannerPreference,
    },
  };
}

export function listCustomers(): string[] {
  return db
    .select({ userId: customers.userId })
    .from(customers)
    .all()
    .map((row) => row.userId);
}

// Contact, address, card and profile replaced in one transaction (or the caller's).
export function replaceCustomerAccount(
  userId: string,
  value: Pick<CustomerAccount, "contactInfo" | "creditCard" | "profile">,
  tx?: Tx,
): void {
  const run = (t: Tx) => {
    const account = t.select().from(accounts).where(eq(accounts.userId, userId)).get();
    if (!account) throw new Error(`No account for ${userId}`);
    const { address, ...parts } = value.contactInfo;
    const contact = t
      .update(contactInfos)
      .set(parts)
      .where(eq(contactInfos.accountId, account.id))
      .returning({ id: contactInfos.id })
      .get();
    if (!contact) throw new Error(`No contact information for ${userId}`);
    t.update(addresses).set(address).where(eq(addresses.contactInfoId, contact.id)).run();
    t.update(creditCards).set(value.creditCard).where(eq(creditCards.accountId, account.id)).run();
    t.update(profiles).set(value.profile).where(eq(profiles.userId, userId)).run();
  };
  if (tx) run(tx);
  else db.transaction(run);
}

// Children go with the customer through the schema's cascades (R-0111).
export function deleteCustomer(userId: string): void {
  db.delete(customers).where(eq(customers.userId, userId)).run();
}
