import type { AccountFormInput } from "./form";

// Shared by the form, account route and registration route tests.
export const validForm: AccountFormInput = {
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
