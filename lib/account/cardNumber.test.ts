import { describe, expect, test } from "vitest";
import { isMaskedCardNumber, maskCardNumber, toLastFour } from "./cardNumber";

describe("card number masking", () => {
  test("AC-1 keeps only the last four digits and masks the display form", () => {
    expect(toLastFour("4111-1111-1111-1111")).toBe("1111");
    expect(maskCardNumber("1111")).toBe("•••• •••• •••• 1111");
    expect(maskCardNumber("")).toBe("");
  });

  test("recognises a masked value coming back from the edit form", () => {
    expect(isMaskedCardNumber(maskCardNumber("1111"))).toBe(true);
    expect(isMaskedCardNumber("4111111111111111")).toBe(false);
    expect(isMaskedCardNumber("")).toBe(false);
  });
});
