import { describe, expect, test } from "vitest";
import {
  ACCOUNT_LANGUAGES,
  CARD_TYPES,
  COUNTRIES,
  EXPIRY_MONTHS,
  FAVORITE_CATEGORIES,
  STATES,
  expiryYears,
} from "./reference";

describe("account reference lists", () => {
  test("AC-2 card types", () => {
    expect([...CARD_TYPES]).toEqual(["Java(TM) Card", "Duke Express", "Meow Card"]);
  });

  test("AC-3 countries and states", () => {
    expect([...COUNTRIES]).toEqual(["United States", "Canada", "Japan", "China"]);
    expect([...STATES]).toEqual(["California", "New York", "Texas"]);
  });

  test("AC-4 expiry years: current plus three, stored outlier added", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    expect(expiryYears(now)).toEqual(["2026", "2027", "2028", "2029"]);
    expect(expiryYears(now, "2028")).toEqual(["2026", "2027", "2028", "2029"]);
    expect(expiryYears(now, "2020")).toEqual(["2026", "2027", "2028", "2029", "2020"]);
    expect(EXPIRY_MONTHS).toHaveLength(12);
    expect(EXPIRY_MONTHS[0]).toBe("01");
    expect(EXPIRY_MONTHS[11]).toBe("12");
  });

  test("AC-5 favourite categories submit catalog ids", () => {
    expect(FAVORITE_CATEGORIES.map((c) => c.id)).toEqual([
      "BIRDS",
      "CATS",
      "DOGS",
      "FISH",
      "REPTILES",
    ]);
    expect(FAVORITE_CATEGORIES.map((c) => c.label)).toEqual([
      "Birds",
      "Cats",
      "Dogs",
      "Fish",
      "Reptiles",
    ]);
  });

  test("AC-6 languages come from supported locales", () => {
    expect(ACCOUNT_LANGUAGES).toEqual([
      { id: "en_US", label: "English (en_US)" },
      { id: "ja_JP", label: "Japanese (ja_JP)" },
      { id: "zh_CN", label: "Chinese (zh_CN)" },
    ]);
  });
});
