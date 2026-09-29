/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stub */
import type { CustomerAccount } from "./types";

export type AccountField =
  | "familyName"
  | "givenName"
  | "streetName1"
  | "streetName2"
  | "city"
  | "state"
  | "zipCode"
  | "country"
  | "telephone"
  | "email"
  | "cardNumber"
  | "cardType"
  | "expiryMonth"
  | "expiryYear"
  | "preferredLanguage"
  | "favoriteCategory";

export type AccountFormInput = Partial<Record<AccountField, string>> & {
  myListPreference?: boolean;
  bannerPreference?: boolean;
};

export type AccountFormValue = Pick<CustomerAccount, "contactInfo" | "creditCard" | "profile">;

export type AccountFormResult =
  | { ok: true; value: AccountFormValue }
  | { ok: false; missing: AccountField[] };

export function parseAccountForm(
  _input: AccountFormInput,
  _mode: "create" | "update",
  _storedLastFour?: string,
): AccountFormResult {
  throw new Error("VortexNotImplemented");
}
