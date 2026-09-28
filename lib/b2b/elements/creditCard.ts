import type { Element } from "@xmldom/xmldom";

import { appendTextElement } from "../xml/build";
import { ChildReader, expectRoot } from "../xml/read";

export interface CreditCard {
  cardNumber: string;
  cardType: string;
  expiryDate: string;
}

/** SWHR-R-0030: `CardNumber`, `CardType`, `ExpiryDate`, in that order. */
export function writeCreditCard(parent: Element, card: CreditCard): Element {
  const doc = parent.ownerDocument;
  if (!doc) {
    throw new Error("CreditCard: parent element has no owner document.");
  }
  const el = doc.createElement("CreditCard");
  parent.appendChild(el);

  appendTextElement(el, "CardNumber", card.cardNumber);
  appendTextElement(el, "CardType", card.cardType);
  appendTextElement(el, "ExpiryDate", card.expiryDate);

  return el;
}

/** SWHR-R-0030: rejects a node that is not `CreditCard`. */
export function readCreditCard(el: Element): CreditCard {
  expectRoot(el, "CreditCard");
  const reader = new ChildReader(el);

  const cardNumber = reader.text("CardNumber");
  const cardType = reader.text("CardType");
  const expiryDate = reader.text("ExpiryDate");
  reader.end();

  return { cardNumber, cardType, expiryDate };
}
