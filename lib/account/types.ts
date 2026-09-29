import type { db } from "../../db/client";

export type AccountStatus = "active" | "disabled";

export interface AddressValue {
  streetName1: string;
  streetName2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ContactInfoValue {
  givenName: string;
  familyName: string;
  telephone: string;
  email: string;
  address: AddressValue;
}

export interface CreditCardValue {
  cardLastFour: string;
  cardType: string;
  expiryDate: string | null;
}

export interface ProfileValue {
  preferredLanguage: string;
  favoriteCategory: string | null;
  myListPreference: boolean;
  bannerPreference: boolean;
}

export interface CustomerAccount {
  userId: string;
  status: AccountStatus;
  contactInfo: ContactInfoValue;
  creditCard: CreditCardValue;
  profile: ProfileValue;
}

// The synchronous drizzle transaction handle from `db.transaction`.
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Domain functions run on `db` by default or join the caller's transaction.
export type Executor = Tx | typeof db;
