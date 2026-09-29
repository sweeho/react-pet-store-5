import { describe, expect, test } from "vitest";

import { composeExpiry, expiryMonth, expiryYear } from "./expiry";

describe("card expiry", () => {
  test("[SWHR-C-0200] stored expiry 07/2004 reads as month 07, year 2004", () => {
    expect(expiryMonth("07/2004")).toBe("07");
    expect(expiryYear("07/2004")).toBe("2004");
    expect(composeExpiry("07", "2004")).toBe("07/2004");
  });

  test("[SWHR-C-0202] expiry '0704' without separator reads as 01 / 2010", () => {
    expect(expiryMonth("0704")).toBe("01");
    expect(expiryYear("0704")).toBe("2010");
  });

  test("[SWHR-C-0203] missing expiry reads as 01 / 2010", () => {
    for (const missing of [null, undefined]) {
      expect(expiryMonth(missing)).toBe("01");
      expect(expiryYear(missing)).toBe("2010");
    }
  });
});
