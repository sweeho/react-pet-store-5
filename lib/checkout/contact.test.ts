import { describe, expect, it } from "vitest";

import { MissingFormDataFailure } from "../errors/failures";
import { type OrderContactInput, validateOrderContacts } from "./contact";

const contact: OrderContactInput = {
  givenName: "ABC",
  familyName: "XYZ",
  streetName1: "1 Main",
  streetName2: "Apt 2",
  city: "Palo Alto",
  state: "California",
  zipCode: "94303",
  country: "United States",
  telephone: "555-555-5555",
  email: "abc@xyz.com",
};

describe("validateOrderContacts", () => {
  it("[SWHR-C-0263] passes with shipping street line 2 and e-mail blank", () => {
    const result = validateOrderContacts({
      billing: contact,
      shipping: { ...contact, streetName2: "", email: "" },
    });
    expect(result.shipping.address.streetName2).toBeNull();
    expect(result.shipping.email).toBe("");
    expect(result.billing.email).toBe("abc@xyz.com");
  });

  it("names every blank required field as section.field", () => {
    try {
      validateOrderContacts({
        billing: { ...contact, city: "  " },
        shipping: { ...contact, telephone: "", givenName: "" },
      });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(MissingFormDataFailure);
      expect((error as MissingFormDataFailure).missing.sort()).toEqual([
        "billing.city",
        "shipping.givenName",
        "shipping.telephone",
      ]);
    }
  });

  it("trims values and does not check the country", () => {
    const result = validateOrderContacts({
      billing: { ...contact, givenName: " ABC ", country: "" },
      shipping: contact,
    });
    expect(result.billing.givenName).toBe("ABC");
  });
});
