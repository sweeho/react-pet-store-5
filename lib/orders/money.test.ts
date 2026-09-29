import { describe, expect, it } from "vitest";

import { decimalToMinor, minorToDecimal } from "./money";

describe("order money", () => {
  it.each([
    [5150, "en_US", "51.50"],
    [1650, "zh_CN", "16.50"],
    [1650, "ja_JP", "1650"],
    [5, "en_US", "0.05"],
    [0, "en_US", "0.00"],
  ])("minorToDecimal(%d, %s) is %s and decimalToMinor inverts it", (minor, locale, text) => {
    expect(minorToDecimal(minor, locale)).toBe(text);
    expect(decimalToMinor(text, locale)).toBe(minor);
  });

  it("rejects too many fraction digits, naming the value", () => {
    expect(() => decimalToMinor("16.505", "en_US")).toThrow(/16\.505/);
    expect(() => decimalToMinor("16.5", "ja_JP")).toThrow(/16\.5/);
  });

  it("rejects non-numeric input and unsupported locales", () => {
    expect(() => decimalToMinor("abc", "en_US")).toThrow(/abc/);
    expect(() => decimalToMinor("-1.00", "en_US")).toThrow(/-1\.00/);
    expect(() => minorToDecimal(1, "de_DE")).toThrow(/de_DE/);
  });

  it("is exact where a float would drift", () => {
    expect(decimalToMinor("1.15", "en_US")).toBe(115);
    expect(decimalToMinor("0.29", "en_US")).toBe(29);
  });
});
