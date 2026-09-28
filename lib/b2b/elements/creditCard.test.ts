import type { Element } from "@xmldom/xmldom";
import { describe, expect, it } from "vitest";

import { createDocument } from "../xml/build";
import { DocumentReadError } from "../xml/errors";
import { parseDocument } from "../xml/parse";
import { type CreditCard, readCreditCard, writeCreditCard } from "./creditCard";

const CARD: CreditCard = {
  cardNumber: "4111111111111111",
  cardType: "Visa",
  expiryDate: "12/03",
};

describe("writeCreditCard / readCreditCard", () => {
  it("[SWHR-C-0061] round-trips with children in order", () => {
    const doc = createDocument("Root");
    const el = writeCreditCard(doc.documentElement!, CARD);

    const childTagNames: string[] = [];
    for (let i = 0; i < el.childNodes.length; i++) {
      const node = el.childNodes[i];
      if (node.nodeType === 1) {
        childTagNames.push((node as Element).tagName);
      }
    }
    expect(childTagNames).toEqual(["CardNumber", "CardType", "ExpiryDate"]);

    expect(readCreditCard(el)).toEqual(CARD);
  });

  it("[SWHR-C-0062] rejects a ContactInfo node offered as a credit card", () => {
    const el = parseDocument("<ContactInfo/>").documentElement!;
    expect(() => readCreditCard(el)).toThrow(new DocumentReadError("CreditCard element expected."));
  });
});
