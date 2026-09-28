import { describe, expect, it } from "vitest";

import { appendTextElement, createDocument } from "./build";
import { serializeDocument } from "./serialize";

describe("serializeDocument", () => {
  it("writes the UTF-8 XML declaration first", () => {
    const doc = createDocument("Root");
    const xml = serializeDocument(doc);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true);
  });

  it("indents nested elements two spaces per level", () => {
    const doc = createDocument("PurchaseOrder");
    const root = doc.documentElement!;
    appendTextElement(root, "OrderId", "1001");
    const shipping = doc.createElement("ShippingInfo");
    root.appendChild(shipping);
    appendTextElement(shipping, "FamilyName", "Doe");

    const xml = serializeDocument(doc);
    expect(xml).toContain(
      "<PurchaseOrder>\n  <OrderId>1001</OrderId>\n  <ShippingInfo>\n    <FamilyName>Doe</FamilyName>\n  </ShippingInfo>\n</PurchaseOrder>",
    );
  });

  it("omits the DOCTYPE when none is given", () => {
    const doc = createDocument("Root");
    const xml = serializeDocument(doc);
    expect(xml).not.toContain("<!DOCTYPE");
  });

  it("writes the given DOCTYPE (SWHR-R-0044's DTD-declared form)", () => {
    const doc = createDocument("PurchaseOrder");
    const xml = serializeDocument(doc, {
      name: "PurchaseOrder",
      publicId: "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD PurchaseOrder 1.1//EN",
      systemId: "http://blueprints.j2ee.sun.com/PurchaseOrder.dtd",
    });
    expect(xml).toContain(
      '<!DOCTYPE PurchaseOrder PUBLIC "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD PurchaseOrder 1.1//EN" "http://blueprints.j2ee.sun.com/PurchaseOrder.dtd">',
    );
  });

  it("self-closes an empty element and escapes text content", () => {
    const doc = createDocument("Root");
    const root = doc.documentElement!;
    appendTextElement(root, "Empty", "");
    appendTextElement(root, "Note", "A & B < C");

    const xml = serializeDocument(doc);
    expect(xml).toContain("<Empty/>");
    expect(xml).toContain("<Note>A &amp; B &lt; C</Note>");
  });

  it("round-trips through parseDocument unchanged in structure", async () => {
    const { parseDocument } = await import("./parse");
    const { ChildReader } = await import("./read");

    const doc = createDocument("PurchaseOrder");
    appendTextElement(doc.documentElement!, "OrderId", "42");
    const xml = serializeDocument(doc);

    const reparsed = parseDocument(xml);
    const reader = new ChildReader(reparsed.documentElement!);
    expect(reader.text("OrderId")).toBe("42");
  });
});
