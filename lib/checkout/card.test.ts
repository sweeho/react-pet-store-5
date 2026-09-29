import { describe, expect, it } from "vitest";

import { orderCardFromAccount } from "./card";

describe("orderCardFromAccount", () => {
  it("masks the number, keeps the type and formats MM/YYYY", () => {
    const card = orderCardFromAccount({
      cardLastFour: "4242",
      cardType: "Visa",
      expiryDate: "12/2030",
    });
    expect(card).toEqual({
      cardNumber: "•••• •••• •••• 4242",
      cardType: "Visa",
      expiryDate: "12/2030",
    });
  });

  it("uses the legacy expiry fallback when stored expiry is null", () => {
    const card = orderCardFromAccount({ cardLastFour: "4242", cardType: "Visa", expiryDate: null });
    expect(card.expiryDate).toBe("01/2010");
  });
});
