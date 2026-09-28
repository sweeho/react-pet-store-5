import { describe, expect, it } from "vitest";

import { formatEmailPrice } from "./price";

/**
 * UNIT TEST
 *
 * Email price formats (Q2, SD-9): dollar pattern for default/en_US/zh_CN,
 * yen pattern for ja_JP.
 */
describe("formatEmailPrice", () => {
  it("[AC-5] formats an en_US price as $#,##0.00", () => {
    expect(formatEmailPrice(1234.5, "en_US")).toBe("$1,234.50");
  });

  it("[AC-6] formats a ja_JP price as ￥#,##0", () => {
    expect(formatEmailPrice(2000, "ja_JP")).toBe("￥2,000");
  });

  it("formats a zh_CN price with the dollar pattern, per the legacy email template", () => {
    expect(formatEmailPrice(1234.5, "zh_CN")).toBe("$1,234.50");
  });

  it("formats the default template price with the dollar pattern", () => {
    expect(formatEmailPrice(1234.5, "default")).toBe("$1,234.50");
  });
});
