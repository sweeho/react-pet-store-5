import type { Element } from "@xmldom/xmldom";

import { appendTextElement } from "../xml/build";
import { DocumentReadError } from "../xml/errors";
import { ChildReader, expectRoot } from "../xml/read";

export interface Address {
  streetName1: string;
  streetName2?: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
}

/**
 * SWHR-R-0028: the second `StreetName` is emitted only when the second
 * street line is present and non-empty; `City`/`State`/`ZipCode`/`Country`
 * are always emitted, empty when their value is absent.
 */
export function writeAddress(parent: Element, address: Address): Element {
  const doc = parent.ownerDocument;
  if (!doc) {
    throw new Error("Address: parent element has no owner document.");
  }
  const el = doc.createElement("Address");
  parent.appendChild(el);

  appendTextElement(el, "StreetName", address.streetName1);
  if (address.streetName2) {
    appendTextElement(el, "StreetName", address.streetName2);
  }
  appendTextElement(el, "City", address.city ?? "");
  appendTextElement(el, "State", address.state ?? "");
  appendTextElement(el, "ZipCode", address.zipCode ?? "");
  appendTextElement(el, "Country", address.country ?? "");

  return el;
}

/**
 * SWHR-R-0029: rejects a node that is not `Address`, requires non-empty
 * `StreetName`/`City`/`State`/`ZipCode`/`Country`, and rejects a present
 * but empty second `StreetName`.
 */
export function readAddress(el: Element): Address {
  expectRoot(el, "Address");
  const reader = new ChildReader(el);

  const streetName1 = reader.text("StreetName");
  const streetName2 = reader.optionalText("StreetName");
  if (streetName2 === "") {
    throw new DocumentReadError("StreetName element: content expected.");
  }
  const city = reader.text("City");
  const state = reader.text("State");
  const zipCode = reader.text("ZipCode");
  const country = reader.text("Country");
  reader.end();

  return { streetName1, streetName2, city, state, zipCode, country };
}
