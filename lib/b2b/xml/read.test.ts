import { describe, expect, it } from "vitest";

import { DocumentReadError } from "./errors";
import { parseDocument } from "./parse";
import { ChildReader, expectRoot } from "./read";

function root(xml: string) {
  return parseDocument(xml).documentElement!;
}

describe("expectRoot", () => {
  it("passes when the element name matches", () => {
    expect(() => expectRoot(root("<PurchaseOrder/>"), "PurchaseOrder")).not.toThrow();
  });

  it("throws DocumentReadError naming the expected element on a mismatch", () => {
    expect(() => expectRoot(root("<SupplierOrder/>"), "PurchaseOrder")).toThrow(
      new DocumentReadError("PurchaseOrder element expected."),
    );
  });

  it("checks the namespace when one is given", () => {
    const el = root('<Root xmlns="urn:a"/>');
    expect(() => expectRoot(el, "Root", "urn:b")).toThrow(DocumentReadError);
    expect(() => expectRoot(el, "Root", "urn:a")).not.toThrow();
  });
});

describe("ChildReader", () => {
  it("reads element children positionally, skipping whitespace text nodes", () => {
    const el = root(`
      <ContactInfo>
        <FamilyName>Doe</FamilyName>
        <GivenName>Jane</GivenName>
      </ContactInfo>
    `);
    const reader = new ChildReader(el);
    expect(reader.text("FamilyName")).toBe("Doe");
    expect(reader.text("GivenName")).toBe("Jane");
    expect(() => reader.end()).not.toThrow();
  });

  it("throws naming the element when it is missing or out of order", () => {
    const el = root(
      "<ContactInfo><GivenName>Jane</GivenName><FamilyName>Doe</FamilyName></ContactInfo>",
    );
    const reader = new ChildReader(el);
    expect(() => reader.text("FamilyName")).toThrow(
      new DocumentReadError("FamilyName element expected."),
    );
  });

  it("throws a content-expected error for an empty required element", () => {
    const el = root("<ContactInfo><FamilyName></FamilyName></ContactInfo>");
    const reader = new ChildReader(el);
    expect(() => reader.text("FamilyName")).toThrow(
      new DocumentReadError("FamilyName element: content expected."),
    );
  });

  it("allows empty content when allowEmpty is set", () => {
    const el = root("<ContactInfo><Email></Email></ContactInfo>");
    const reader = new ChildReader(el);
    expect(reader.text("Email", { allowEmpty: true })).toBe("");
  });

  it("optionalText returns null without consuming when the element is absent", () => {
    const el = root("<Address><City>Springfield</City></Address>");
    const reader = new ChildReader(el);
    expect(reader.optionalText("StreetName2")).toBeNull();
    expect(reader.text("City")).toBe("Springfield");
  });

  it("optionalText consumes and returns the text when the element is present", () => {
    const el = root("<Address><StreetName2>Apt 4</StreetName2><City>Springfield</City></Address>");
    const reader = new ChildReader(el);
    expect(reader.optionalText("StreetName2")).toBe("Apt 4");
    expect(reader.text("City")).toBe("Springfield");
  });

  it("element returns the raw Element node", () => {
    const el = root(
      "<PurchaseOrder><ShippingInfo><FamilyName>Doe</FamilyName></ShippingInfo></PurchaseOrder>",
    );
    const reader = new ChildReader(el);
    const shipping = reader.element("ShippingInfo");
    expect(shipping.tagName).toBe("ShippingInfo");
  });

  it("elements collects a run of same-named siblings", () => {
    const el = root("<PurchaseOrder><LineItem>1</LineItem><LineItem>2</LineItem></PurchaseOrder>");
    const reader = new ChildReader(el);
    const items = reader.elements("LineItem");
    expect(items.map((i) => i.textContent)).toEqual(["1", "2"]);
  });

  it("elements throws when fewer than min are present", () => {
    const el = root("<PurchaseOrder></PurchaseOrder>");
    const reader = new ChildReader(el);
    expect(() => reader.elements("LineItem", 1)).toThrow(DocumentReadError);
  });

  it("elements returns an empty array when min is 0 and none are present", () => {
    const el = root("<PurchaseOrder><OrderId>1</OrderId></PurchaseOrder>");
    const reader = new ChildReader(el);
    expect(reader.elements("LineItem")).toEqual([]);
  });

  it("end throws DocumentReadError on an unexpected trailing element", () => {
    const el = root("<ContactInfo><FamilyName>Doe</FamilyName><Extra>x</Extra></ContactInfo>");
    const reader = new ChildReader(el);
    reader.text("FamilyName");
    expect(() => reader.end()).toThrow(DocumentReadError);
  });
});
