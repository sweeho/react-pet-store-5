import type { ContactInfo } from "../b2b/elements/contactInfo";

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

export function validateOrderContacts(form: OrderForm): {
  billing: ContactInfo;
  shipping: ContactInfo;
} {
  void form;
  throw new Error("VortexNotImplemented");
}
