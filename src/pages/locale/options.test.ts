import { describe, expect, it } from "vitest";

import { labelKeyForLocale, LOCALE_CHOICES } from "./options";

/**
 * UNIT TEST
 *
 * The four-option choice list data (D6, Q4, SD-3) and the lookup used to
 * label whichever locale ends up in effect on the confirmation screen.
 */
describe("LOCALE_CHOICES", () => {
  it("lists exactly US English, German, Japanese and Simplified Chinese", () => {
    expect(LOCALE_CHOICES.map((choice) => choice.id)).toEqual(["en_US", "de_DE", "ja_JP", "zh_CN"]);
  });
});

describe("labelKeyForLocale", () => {
  it("resolves each of the four choices to its own label key", () => {
    expect(labelKeyForLocale("en_US")).toBe("optionEnUs");
    expect(labelKeyForLocale("de_DE")).toBe("optionDeDe");
    expect(labelKeyForLocale("ja_JP")).toBe("optionJaJp");
    expect(labelKeyForLocale("zh_CN")).toBe("optionZhCn");
  });

  it("falls back to the US English label for a locale outside the choice list", () => {
    expect(labelKeyForLocale("fr_FR")).toBe("optionEnUs");
  });
});
