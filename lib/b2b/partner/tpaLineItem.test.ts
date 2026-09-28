import { describe, expect, it } from "vitest";

import type { LineItem } from "../elements/lineItem";
import { createDocument } from "../xml/build";
import { DocumentReadError } from "../xml/errors";
import { parseDocument } from "../xml/parse";
import { readTPALineItem, TPA_LINE_ITEM_NAMESPACE, writeTPALineItem } from "./tpaLineItem";

const ITEM: LineItem = {
  categoryId: "cat-1",
  productId: "prod-1",
  itemId: "EST-1",
  lineNum: 1,
  quantity: 2,
  unitPrice: "19.99",
};

describe("writeTPALineItem / readTPALineItem", () => {
  it("round-trips every field as attributes in the TPALineItem namespace", () => {
    const doc = createDocument("Root");
    const el = writeTPALineItem(doc.documentElement!, ITEM);

    expect(el.namespaceURI).toBe(TPA_LINE_ITEM_NAMESPACE);
    expect(el.getAttribute("categoryId")).toBe("cat-1");
    expect(el.getAttribute("productId")).toBe("prod-1");
    expect(el.getAttribute("itemId")).toBe("EST-1");
    expect(el.getAttribute("lineNo")).toBe("1");
    expect(el.getAttribute("quantity")).toBe("2");
    expect(el.getAttribute("unitPrice")).toBe("19.99");
    expect(readTPALineItem(el)).toEqual(ITEM);
  });

  it("writes unitPrice exactly as given, with no float round trip (design.md P2, R8)", () => {
    const doc = createDocument("Root");
    const el = writeTPALineItem(doc.documentElement!, { ...ITEM, unitPrice: "0.0" });
    expect(el.getAttribute("unitPrice")).toBe("0.0");
  });

  it("rejects a node that is not a LineItem in the TPALineItem namespace", () => {
    const el = parseDocument("<LineItem/>").documentElement!;
    expect(() => readTPALineItem(el)).toThrow(DocumentReadError);
    expect(() => readTPALineItem(el)).toThrow("LineItem element expected.");
  });

  it("rejects a non-integer lineNo attribute", () => {
    const doc = createDocument("Root");
    const el = writeTPALineItem(doc.documentElement!, ITEM);
    el.setAttribute("lineNo", "one");
    expect(() => readTPALineItem(el)).toThrow("lineNo attribute: integer expected.");
  });

  it("rejects a non-integer quantity attribute", () => {
    const doc = createDocument("Root");
    const el = writeTPALineItem(doc.documentElement!, ITEM);
    el.setAttribute("quantity", "1.5");
    expect(() => readTPALineItem(el)).toThrow("quantity attribute: integer expected.");
  });

  it("rejects a non-decimal unitPrice attribute", () => {
    const doc = createDocument("Root");
    const el = writeTPALineItem(doc.documentElement!, ITEM);
    el.setAttribute("unitPrice", "free");
    expect(() => readTPALineItem(el)).toThrow("unitPrice attribute: decimal number expected.");
  });
});
