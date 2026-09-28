import type { Element } from "@xmldom/xmldom";

import { appendTextElement } from "../xml/build";
import { ChildReader, expectRoot } from "../xml/read";
import { type Address, readAddress, writeAddress } from "./address";

export interface ContactInfo {
  familyName: string;
  givenName: string;
  address: Address;
  email: string;
  phone: string;
}

/**
 * SWHR-R-0027: `FamilyName`, `GivenName`, `Address`, `Email`, `Phone`, in
 * that exact order.
 */
export function writeContactInfo(parent: Element, contact: ContactInfo): Element {
  const doc = parent.ownerDocument;
  if (!doc) {
    throw new Error("ContactInfo: parent element has no owner document.");
  }
  const el = doc.createElement("ContactInfo");
  parent.appendChild(el);

  appendTextElement(el, "FamilyName", contact.familyName);
  appendTextElement(el, "GivenName", contact.givenName);
  writeAddress(el, contact.address);
  appendTextElement(el, "Email", contact.email);
  appendTextElement(el, "Phone", contact.phone);

  return el;
}

/**
 * SWHR-R-0027: rejects a node that is not `ContactInfo`, requires
 * non-empty `FamilyName`/`GivenName`/`Phone`, and accepts an empty
 * `Email`.
 */
export function readContactInfo(el: Element): ContactInfo {
  expectRoot(el, "ContactInfo");
  const reader = new ChildReader(el);

  const familyName = reader.text("FamilyName");
  const givenName = reader.text("GivenName");
  const address = readAddress(reader.element("Address"));
  const email = reader.text("Email", { allowEmpty: true });
  const phone = reader.text("Phone");
  reader.end();

  return { familyName, givenName, address, email, phone };
}
