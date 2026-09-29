import type { ContactInfo } from "../b2b/elements/contactInfo";
import { MissingFormDataFailure } from "../errors/failures";

export interface OrderContactInput {
  givenName: string;
  familyName: string;
  streetName1: string;
  streetName2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  telephone: string;
  email: string;
}

export interface OrderForm {
  billing: OrderContactInput;
  shipping: OrderContactInput;
}

const REQUIRED = [
  "givenName",
  "familyName",
  "streetName1",
  "city",
  "state",
  "zipCode",
  "telephone",
] as const;

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toContact(
  section: "billing" | "shipping",
  input: Partial<OrderContactInput> | undefined,
  missing: string[],
): ContactInfo {
  const value = (field: keyof OrderContactInput): string => trimmed(input?.[field]);
  for (const field of REQUIRED) {
    if (value(field) === "") missing.push(`${section}.${field}`);
  }
  return {
    familyName: value("familyName"),
    givenName: value("givenName"),
    address: {
      streetName1: value("streetName1"),
      streetName2: value("streetName2") || null,
      city: value("city"),
      state: value("state"),
      zipCode: value("zipCode"),
      country: value("country"),
    },
    email: value("email"),
    phone: value("telephone"),
  };
}

/** Throws `MissingFormDataFailure` naming each blank required field. */
export function validateOrderContacts(form: OrderForm): {
  billing: ContactInfo;
  shipping: ContactInfo;
} {
  const missing: string[] = [];
  const billing = toContact("billing", form?.billing, missing);
  const shipping = toContact("shipping", form?.shipping, missing);
  if (missing.length > 0) throw new MissingFormDataFailure(missing);
  return { billing, shipping };
}
