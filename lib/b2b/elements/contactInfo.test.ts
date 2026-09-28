import { describe, expect, it } from "vitest";

import { createDocument } from "../xml/build";
import { DocumentReadError } from "../xml/errors";
import { parseDocument } from "../xml/parse";
import type { Address } from "./address";
import { type ContactInfo, readContactInfo, writeContactInfo } from "./contactInfo";

const ADDRESS: Address = {
  streetName1: "1 Main St",
  streetName2: null,
  city: "Springfield",
  state: "IL",
  zipCode: "62701",
  country: "USA",
};

const CONTACT: ContactInfo = {
  familyName: "Doe",
  givenName: "Jane",
  address: ADDRESS,
  email: "jane@example.com",
  phone: "555-1234",
};

function contactInfoElement(xml: string) {
  return parseDocument(xml).documentElement!;
}

describe("writeContactInfo / readContactInfo", () => {
  it("round-trips a full contact", () => {
    const doc = createDocument("Root");
    const el = writeContactInfo(doc.documentElement!, CONTACT);

    expect(readContactInfo(el)).toEqual(CONTACT);
  });

  it("[SWHR-C-0053] accepts an empty Email element", () => {
    const doc = createDocument("Root");
    const el = writeContactInfo(doc.documentElement!, { ...CONTACT, email: "" });

    expect(readContactInfo(el).email).toBe("");
  });

  it("[SWHR-C-0054] rejects an empty Phone element", () => {
    const el = contactInfoElement(
      "<ContactInfo>" +
        "<FamilyName>Doe</FamilyName><GivenName>Jane</GivenName>" +
        "<Address><StreetName>1 Main St</StreetName><City>Springfield</City><State>IL</State><ZipCode>62701</ZipCode><Country>USA</Country></Address>" +
        "<Email>jane@example.com</Email><Phone></Phone></ContactInfo>",
    );
    expect(() => readContactInfo(el)).toThrow(
      new DocumentReadError("Phone element: content expected."),
    );
  });

  it("[SWHR-C-0055] rejects GivenName before FamilyName, naming FamilyName as expected", () => {
    const el = contactInfoElement(
      "<ContactInfo>" +
        "<GivenName>Jane</GivenName><FamilyName>Doe</FamilyName>" +
        "<Address><StreetName>1 Main St</StreetName><City>Springfield</City><State>IL</State><ZipCode>62701</ZipCode><Country>USA</Country></Address>" +
        "<Email>jane@example.com</Email><Phone>555-1234</Phone></ContactInfo>",
    );
    expect(() => readContactInfo(el)).toThrow(
      new DocumentReadError("FamilyName element expected."),
    );
  });

  it("rejects a node that is not a ContactInfo element", () => {
    const el = contactInfoElement("<Address/>");
    expect(() => readContactInfo(el)).toThrow(
      new DocumentReadError("ContactInfo element expected."),
    );
  });
});
