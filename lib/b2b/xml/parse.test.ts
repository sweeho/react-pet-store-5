import { describe, expect, it, vi } from "vitest";

import { MalformedDocumentError } from "./errors";
import { parseDocument } from "./parse";

describe("parseDocument", () => {
  it("parses a well-formed document into a Document", () => {
    const doc = parseDocument("<Root><Child>x</Child></Root>");
    expect(doc.documentElement?.tagName).toBe("Root");
  });

  /**
   * SWHR-R-0046.01 / SWHR-C-0087: a document with an unclosed element fails
   * parsing and is never handed to a downstream processor.
   */
  it("[SWHR-C-0087] rejects a document with an unclosed element and never calls the downstream processor", () => {
    const downstream = vi.fn();
    const xml = "<PurchaseOrder><OrderId>1001</OrderId>";

    expect(() => {
      const doc = parseDocument(xml);
      downstream(doc);
    }).toThrow(MalformedDocumentError);

    expect(downstream).not.toHaveBeenCalled();
  });

  it("rejects a document with mismatched open/close tags", () => {
    expect(() => parseDocument("<a><b></a></b>")).toThrow(MalformedDocumentError);
  });

  it("rejects an empty string", () => {
    expect(() => parseDocument("")).toThrow(MalformedDocumentError);
  });
});
