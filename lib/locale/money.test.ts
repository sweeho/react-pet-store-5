import { describe, expect, it } from "vitest";

import { formatPrice } from "./money";

describe("formatPrice", () => {
  it("[AC-5] formats 1850 minor units as $18.50 in US currency format for en_US", () => {
    expect(formatPrice(1850, "en_US")).toBe("$18.50");
  });

  it("[AC-5] formats 2000 minor units as ￥2,000 in Japanese currency format for ja_JP, with no conversion", () => {
    expect(formatPrice(2000, "ja_JP")).toBe("￥2,000");
  });

  it("formats 12000 minor units as ¥120.00 in Chinese currency format for zh_CN", () => {
    expect(formatPrice(12000, "zh_CN")).toBe("¥120.00");
  });

  it("falls back to US currency format for an unsupported locale", () => {
    expect(formatPrice(1850, "de_DE")).toBe("$18.50");
  });
});
