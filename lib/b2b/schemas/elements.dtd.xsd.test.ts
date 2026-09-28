import { describe, expect, it } from "vitest";

import { validateDocument } from "../xml/validate";
import { BUNDLED_SCHEMA_CATALOG } from "./catalog";

function publicId(name: string): string {
  const id = BUNDLED_SCHEMA_CATALOG.find((entry) => entry.file === `${name}.dtd.xsd`)?.identifier;
  if (!id) {
    throw new Error(`No catalog entry for ${name}.dtd.xsd`);
  }
  return id;
}

const VALID_ADDRESS =
  "<Address><StreetName>1 Main St</StreetName><City>Springfield</City>" +
  "<State>IL</State><ZipCode>62701</ZipCode><Country>USA</Country></Address>";

const VALID_CONTACT_INFO =
  "<ContactInfo><FamilyName>Doe</FamilyName><GivenName>Jane</GivenName>" +
  `${VALID_ADDRESS}<Email></Email><Phone>555-1234</Phone></ContactInfo>`;

const VALID_CREDIT_CARD =
  "<CreditCard><CardNumber>4111111111111111</CardNumber><CardType>Visa</CardType>" +
  "<ExpiryDate>12/03</ExpiryDate></CreditCard>";

const VALID_LINE_ITEM =
  "<LineItem><CategoryId>cat-1</CategoryId><ProductId>prod-1</ProductId>" +
  "<ItemId>item-1</ItemId><LineNum>1</LineNum><Quantity>5</Quantity>" +
  "<UnitPrice>19.99</UnitPrice></LineItem>";

describe("bundled 1.1 element DTD-equivalent XSDs", () => {
  it("validates a well-formed Address document", async () => {
    expect(await validateDocument(VALID_ADDRESS, publicId("Address"))).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("validates a well-formed ContactInfo document (including its included Address)", async () => {
    expect(await validateDocument(VALID_CONTACT_INFO, publicId("ContactInfo"))).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("validates a well-formed CreditCard document", async () => {
    expect(await validateDocument(VALID_CREDIT_CARD, publicId("CreditCard"))).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("validates a well-formed LineItem document", async () => {
    expect(await validateDocument(VALID_LINE_ITEM, publicId("LineItem"))).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("reports a structural violation without throwing", async () => {
    const result = await validateDocument(
      "<CreditCard><CardNumber>1</CardNumber></CreditCard>",
      publicId("CreditCard"),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
