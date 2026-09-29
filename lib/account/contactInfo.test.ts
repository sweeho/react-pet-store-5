import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { db } from "../../db/client";
import { addresses, contactInfos } from "../../db/schema";
import {
  createAddress,
  createContactInfoFromParts,
  createContactInfoFromValue,
  createEmptyContactInfo,
  getContactInfo,
  updateContactField,
} from "./contactInfo";
import type { ContactInfoValue } from "./types";

const value: ContactInfoValue = {
  givenName: "ABC",
  familyName: "XYZ",
  telephone: "555-555-5555",
  email: "abc@example.com",
  address: {
    streetName1: "1 Main",
    streetName2: "Apt 2",
    city: "Palo Alto",
    state: "California",
    zipCode: "94303",
    country: "United States",
  },
};

const addressCount = () => db.select().from(addresses).all().length;

describe("contact information", () => {
  test("[SWHR-C-0211] from a complete value copies fields and creates a new address", () => {
    const before = addressCount();
    const id = createContactInfoFromValue(value);
    expect(addressCount()).toBe(before + 1);
    expect(getContactInfo(id)).toEqual(value);
  });

  test("[SWHR-C-0212] from separate values links to existing address A", () => {
    const addressId = createAddress(value.address);
    const before = addressCount();
    const id = createContactInfoFromParts(
      { givenName: "G", familyName: "F", telephone: "1", email: "e@x" },
      addressId,
    );
    expect(addressCount()).toBe(before);
    const a = db.select().from(addresses).where(eq(addresses.id, addressId)).get();
    expect(a?.contactInfoId).toBe(id);
    expect(getContactInfo(id)?.address).toEqual(value.address);
  });

  test("[SWHR-C-0213] empty contact info links to a new empty address", () => {
    const before = addressCount();
    const id = createEmptyContactInfo();
    expect(addressCount()).toBe(before + 1);
    expect(getContactInfo(id)).toEqual({
      givenName: "",
      familyName: "",
      telephone: "",
      email: "",
      address: {
        streetName1: "",
        streetName2: null,
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
    });
  });

  test("[SWHR-C-0214] updating only the telephone leaves other contact fields unchanged", () => {
    const id = createContactInfoFromValue(value);
    updateContactField(id, "telephone", "555-000-0000");
    expect(getContactInfo(id)).toEqual({ ...value, telephone: "555-000-0000" });
  });

  test("[SWHR-C-0215] modifying a whole-value copy does not change the stored contact", () => {
    const id = createContactInfoFromValue(value);
    const copy = getContactInfo(id);
    if (!copy) throw new Error("missing contact");
    copy.email = "changed@example.com";
    copy.address.city = "Elsewhere";
    const stored = getContactInfo(id);
    expect(stored?.email).toBe(value.email);
    expect(stored?.address.city).toBe(value.address.city);
  });

  test("[SWHR-C-0216] data store returns contact info with no role or session context", () => {
    const id = createContactInfoFromValue(value);
    expect(db.select().from(contactInfos).where(eq(contactInfos.id, id)).all()).toHaveLength(1);
    expect(getContactInfo(id)).not.toBeNull();
  });
});
