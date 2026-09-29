import { parseLocale } from "../locale/model";
import { isMaskedCardNumber, toLastFour } from "./cardNumber";
import { composeExpiry } from "./expiry";
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

// Required in form order; the 400 response lists them in this order (P6).
const REQUIRED: readonly AccountField[] = [
  "familyName",
  "givenName",
  "streetName1",
  "city",
  "state",
  "zipCode",
  "telephone",
  "cardNumber",
  "cardType",
  "expiryMonth",
  "expiryYear",
  "preferredLanguage",
  "favoriteCategory",
];

// One validator for registration and edit (P6). `storedLastFour` is the card
// already on file: on update a blank or masked card number keeps it (P3).
export function parseAccountForm(
  input: AccountFormInput,
  mode: "create" | "update",
  storedLastFour = "",
): AccountFormResult {
  const text = (field: AccountField): string => {
    const raw: unknown = input[field];
    return typeof raw === "string" ? raw.trim() : "";
  };

  const keepStoredCard =
    mode === "update" && (text("cardNumber") === "" || isMaskedCardNumber(text("cardNumber")));
  const language = parseLocale(text("preferredLanguage"));

  const missing = REQUIRED.filter((field) => {
    if (field === "cardNumber") return !keepStoredCard && text(field) === "";
    if (field === "preferredLanguage") return language === null;
    return text(field) === "";
  });
  if (missing.length > 0 || language === null) return { ok: false, missing };

  return {
    ok: true,
    value: {
      contactInfo: {
        givenName: text("givenName"),
        familyName: text("familyName"),
        telephone: text("telephone"),
        email: text("email"),
        address: {
          streetName1: text("streetName1"),
          streetName2: text("streetName2") || null,
          city: text("city"),
          state: text("state"),
          zipCode: text("zipCode"),
          country: text("country"),
        },
      },
      creditCard: {
        cardLastFour: keepStoredCard ? storedLastFour : toLastFour(text("cardNumber")),
        cardType: text("cardType"),
        expiryDate: composeExpiry(text("expiryMonth"), text("expiryYear")),
      },
      profile: {
        preferredLanguage: language.id,
        favoriteCategory: text("favoriteCategory"),
        myListPreference: input.myListPreference === true,
        bannerPreference: input.bannerPreference === true,
      },
    },
  };
}
