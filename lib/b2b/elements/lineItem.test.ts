import { describe, expect, it } from "vitest";

import { createDocument } from "../xml/build";
import { DocumentReadError } from "../xml/errors";
import { parseDocument } from "../xml/parse";
import {
  type LineItem,
  type StoredLineItem,
  readLineItem,
  toExportLineItem,
  writeLineItem,
} from "./lineItem";

const ITEM: LineItem = {
  categoryId: "cat-1",
  productId: "prod-1",
  itemId: "item-1",
  lineNum: 1,
  quantity: 5,
  unitPrice: "19.99",
};

function lineItemElement(xml: string) {
  return parseDocument(xml).documentElement!;
}

describe("writeLineItem / readLineItem", () => {
  it("round-trips a full line item", () => {
    const doc = createDocument("Root");
    const el = writeLineItem(doc.documentElement!, ITEM);

    expect(readLineItem(el)).toEqual(ITEM);
  });

  it("rejects a node that is not a LineItem element", () => {
    const el = lineItemElement("<ContactInfo/>");
    expect(() => readLineItem(el)).toThrow(new DocumentReadError("LineItem element expected."));
  });

  it("[SWHR-C-0063] rejects a non-numeric Quantity and produces no line item", () => {
    const el = lineItemElement(
      "<LineItem><CategoryId>cat-1</CategoryId><ProductId>prod-1</ProductId>" +
        "<ItemId>item-1</ItemId><LineNum>1</LineNum><Quantity>two</Quantity>" +
        "<UnitPrice>19.99</UnitPrice></LineItem>",
    );
    expect(() => readLineItem(el)).toThrow(DocumentReadError);
  });

  it("[SWHR-C-0064] rejects a missing UnitPrice, naming it as expected", () => {
    const el = lineItemElement(
      "<LineItem><CategoryId>cat-1</CategoryId><ProductId>prod-1</ProductId>" +
        "<ItemId>item-1</ItemId><LineNum>1</LineNum><Quantity>5</Quantity></LineItem>",
    );
    expect(() => readLineItem(el)).toThrow(new DocumentReadError("UnitPrice element expected."));
  });
});

describe("toExportLineItem", () => {
  it("[SWHR-C-0065] exports ordered quantity only, with no shipped-quantity value", () => {
    const stored: StoredLineItem = { ...ITEM, quantity: 5, quantityShipped: 3 };

    const exported = toExportLineItem(stored);

    expect(exported).toEqual(ITEM);
    expect(exported.quantity).toBe(5);
    expect(Object.keys(exported)).not.toContain("quantityShipped");
    expect(Object.values(exported)).not.toContain(3);
  });
});
