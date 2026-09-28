import type { Element } from "@xmldom/xmldom";
import { describe, expect, it } from "vitest";

import { createDocument } from "../xml/build";
import { DocumentReadError } from "../xml/errors";
import { parseDocument } from "../xml/parse";
import { type Address, readAddress, writeAddress } from "./address";

function childNames(el: Element): string[] {
  const names: string[] = [];
  for (let i = 0; i < el.childNodes.length; i++) {
    const node = el.childNodes[i];
    if (node.nodeType === 1) {
      names.push((node as Element).tagName);
    }
  }
  return names;
}

const FULL_ADDRESS: Address = {
  streetName1: "1 Main St",
  streetName2: "Apt 4",
  city: "Springfield",
  state: "IL",
  zipCode: "62701",
  country: "USA",
};

describe("writeAddress", () => {
  it("[SWHR-C-0056] writes exactly one StreetName when the second street line is empty", () => {
    const doc = createDocument("Root");
    const el = writeAddress(doc.documentElement!, { ...FULL_ADDRESS, streetName2: "" });

    expect(childNames(el)).toEqual(["StreetName", "City", "State", "ZipCode", "Country"]);
  });

  it("[SWHR-C-0057] emits an empty State element in position when state is missing", () => {
    const doc = createDocument("Root");
    const el = writeAddress(doc.documentElement!, { ...FULL_ADDRESS, state: null });

    expect(childNames(el)).toEqual([
      "StreetName",
      "StreetName",
      "City",
      "State",
      "ZipCode",
      "Country",
    ]);
    const stateEl = el.getElementsByTagName("State")[0];
    expect(stateEl.textContent).toBe("");
  });

  it("writes two StreetName elements when the second street line is present", () => {
    const doc = createDocument("Root");
    const el = writeAddress(doc.documentElement!, FULL_ADDRESS);

    expect(childNames(el)).toEqual([
      "StreetName",
      "StreetName",
      "City",
      "State",
      "ZipCode",
      "Country",
    ]);
  });
});

describe("readAddress", () => {
  function addressElement(xml: string) {
    return parseDocument(xml).documentElement!;
  }

  it("round-trips a full address", () => {
    const doc = createDocument("Root");
    writeAddress(doc.documentElement!, FULL_ADDRESS);
    const addressEl = doc.documentElement!.getElementsByTagName("Address")[0];

    expect(readAddress(addressEl)).toEqual(FULL_ADDRESS);
  });

  it("rejects a node that is not an Address element", () => {
    const el = addressElement("<ContactInfo/>");
    expect(() => readAddress(el)).toThrow(new DocumentReadError("Address element expected."));
  });

  it("[SWHR-C-0058] rejects an empty City", () => {
    const el = addressElement(
      "<Address><StreetName>1 Main St</StreetName><City></City><State>IL</State><ZipCode>62701</ZipCode><Country>USA</Country></Address>",
    );
    expect(() => readAddress(el)).toThrow(new DocumentReadError("City element: content expected."));
  });

  it("[SWHR-C-0059] rejects a missing Country, naming it as expected", () => {
    const el = addressElement(
      "<Address><StreetName>1 Main St</StreetName><City>Springfield</City><State>IL</State><ZipCode>62701</ZipCode></Address>",
    );
    expect(() => readAddress(el)).toThrow(new DocumentReadError("Country element expected."));
  });

  it("[SWHR-C-0060] rejects a present but empty second StreetName", () => {
    const el = addressElement(
      "<Address><StreetName>1 Main St</StreetName><StreetName></StreetName><City>Springfield</City><State>IL</State><ZipCode>62701</ZipCode><Country>USA</Country></Address>",
    );
    expect(() => readAddress(el)).toThrow(DocumentReadError);
  });
});
