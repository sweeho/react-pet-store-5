import { describe, expect, it } from "vitest";

import { appendTextElement, createDocument } from "./build";
import { MissingValueError } from "./errors";

describe("createDocument", () => {
  it("creates a document whose root element has the given name", () => {
    const doc = createDocument("PurchaseOrder");
    expect(doc.documentElement?.tagName).toBe("PurchaseOrder");
    expect(doc.documentElement?.namespaceURI).toBeNull();
  });

  it("creates the root element in the given namespace", () => {
    const doc = createDocument("SupplierOrder", "http://blueprints.j2ee.sun.com/TPASupplierOrder");
    expect(doc.documentElement?.namespaceURI).toBe(
      "http://blueprints.j2ee.sun.com/TPASupplierOrder",
    );
  });
});

describe("appendTextElement", () => {
  it("appends a child element carrying the given text", () => {
    const doc = createDocument("Root");
    const el = appendTextElement(doc.documentElement!, "OrderId", "1001");
    expect(el.tagName).toBe("OrderId");
    expect(el.textContent).toBe("1001");
    expect(doc.documentElement!.childNodes.length).toBe(1);
  });

  it("appends an empty element for an empty string value", () => {
    const doc = createDocument("Root");
    const el = appendTextElement(doc.documentElement!, "State", "");
    expect(el.textContent).toBe("");
    expect(el.childNodes.length).toBe(0);
  });

  it("throws MissingValueError naming the element for null", () => {
    const doc = createDocument("Root");
    expect(() => appendTextElement(doc.documentElement!, "City", null)).toThrow(MissingValueError);
    expect(() => appendTextElement(doc.documentElement!, "City", null)).toThrow(/City/);
  });

  it("throws MissingValueError naming the element for undefined", () => {
    const doc = createDocument("Root");
    expect(() => appendTextElement(doc.documentElement!, "Country", undefined)).toThrow(
      MissingValueError,
    );
  });

  it("appends the child in a namespace when given one", () => {
    const doc = createDocument("Root", "urn:example");
    const el = appendTextElement(doc.documentElement!, "OrderId", "1", "urn:example");
    expect(el.namespaceURI).toBe("urn:example");
  });
});
