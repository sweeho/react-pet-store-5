import { afterEach, describe, expect, it } from "vitest";

import { normaliseOrderLocale } from "./locale";

/**
 * UNIT TEST
 *
 * Purchase order locale default (D5, P6): en_US when the order carries none.
 */
describe("normaliseOrderLocale", () => {
  const ORIGINAL_ENV = process.env.DEFAULT_LOCALE;

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.DEFAULT_LOCALE;
    } else {
      process.env.DEFAULT_LOCALE = ORIGINAL_ENV;
    }
  });

  it("[AC-1] defaults to en_US when the order carries no locale", () => {
    delete process.env.DEFAULT_LOCALE;
    expect(normaliseOrderLocale()).toBe("en_US");
    expect(normaliseOrderLocale(null)).toBe("en_US");
    expect(normaliseOrderLocale("")).toBe("en_US");
  });

  it("returns the given identifier unchanged when present", () => {
    expect(normaliseOrderLocale("ja_JP")).toBe("ja_JP");
    expect(normaliseOrderLocale("de_DE")).toBe("de_DE");
  });
});
