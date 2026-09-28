import { describe, expect, it } from "vitest";

import { formatDocumentDate, parseDocumentDate } from "./dates";

describe("formatDocumentDate", () => {
  it("formats a date as yyyy-MM-dd, dropping the time of day", () => {
    expect(formatDocumentDate(new Date(2002, 2, 15, 14, 32))).toBe("2002-03-15");
  });

  it("zero-pads single-digit month and day", () => {
    expect(formatDocumentDate(new Date(2002, 0, 5))).toBe("2002-01-05");
  });
});

describe("parseDocumentDate", () => {
  it("parses a valid yyyy-MM-dd string", () => {
    const parsed = parseDocumentDate("2002-03-15");
    expect(parsed).not.toBeNull();
    expect(formatDocumentDate(parsed!)).toBe("2002-03-15");
  });

  it("returns null for null input", () => {
    expect(parseDocumentDate(null)).toBeNull();
  });

  it("returns null for a differently-formatted date", () => {
    expect(parseDocumentDate("15/03/2002")).toBeNull();
  });

  it("returns null for an unparseable string", () => {
    expect(parseDocumentDate("not-a-date")).toBeNull();
  });

  it("returns null for a syntactically valid but nonexistent calendar date", () => {
    expect(parseDocumentDate("2002-02-30")).toBeNull();
  });
});
