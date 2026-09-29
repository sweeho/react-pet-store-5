import { describe, expect, it } from "vitest";

import { parseAccountForm } from "./form";
import { validForm } from "./form.fixture";

describe("parseAccountForm", () => {
  it("[SWHR-C-0201] composes expiry 03/2005 from month 03 and year 2005", () => {
    const result = parseAccountForm(validForm, "create");
    expect(result).toMatchObject({ ok: true, value: { creditCard: { expiryDate: "03/2005" } } });
  });

  it("[SWHR-C-0219] reports a city of only spaces as missing", () => {
    expect(parseAccountForm({ ...validForm, city: "   " }, "create")).toEqual({
      ok: false,
      missing: ["city"],
    });
  });

  it("[SWHR-C-0220] stores a blank street line 2 as null and no email as empty", () => {
    const result = parseAccountForm({ ...validForm, email: undefined, streetName2: "" }, "create");
    expect(result).toMatchObject({
      ok: true,
      value: { contactInfo: { email: "", address: { streetName2: null } } },
    });
  });

  it("[SWHR-C-0221] stores absent preferences as off", () => {
    expect(
      parseAccountForm(
        { ...validForm, myListPreference: undefined, bannerPreference: undefined },
        "create",
      ),
    ).toMatchObject({
      ok: true,
      value: { profile: { myListPreference: false, bannerPreference: false } },
    });
  });

  it("[SWHR-C-0222] reports a missing favourite category", () => {
    expect(parseAccountForm({ ...validForm, favoriteCategory: undefined }, "create")).toEqual({
      ok: false,
      missing: ["favoriteCategory"],
    });
  });

  it("reports every missing field at once and keeps only the last four card digits", () => {
    expect(parseAccountForm({}, "create")).toMatchObject({
      ok: false,
      missing: expect.arrayContaining(["familyName", "cardNumber", "expiryYear"]),
    });
    expect(parseAccountForm(validForm, "create")).toMatchObject({
      value: { creditCard: { cardLastFour: "1111" } },
    });
  });

  it("keeps the stored last four when an update leaves the card number blank or masked", () => {
    for (const cardNumber of ["", "•••• •••• •••• 1234"]) {
      expect(parseAccountForm({ ...validForm, cardNumber }, "update", "1234")).toMatchObject({
        ok: true,
        value: { creditCard: { cardLastFour: "1234" } },
      });
    }
    expect(parseAccountForm({ ...validForm, cardNumber: "" }, "create")).toMatchObject({
      ok: false,
      missing: ["cardNumber"],
    });
  });
});
