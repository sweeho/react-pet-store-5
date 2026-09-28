import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getDefaultLocale, isSupportedLocale, parseLocale, SUPPORTED_LOCALES } from "./model";

/**
 * UNIT TEST
 *
 * The single locale model shared by server and SPA: the supported list,
 * the configurable default, and the `language_COUNTRY` parser (design D1).
 */
describe("SUPPORTED_LOCALES", () => {
  it("lists exactly en_US, ja_JP and zh_CN", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en_US", "ja_JP", "zh_CN"]);
  });
});

describe("isSupportedLocale", () => {
  it("accepts each supported locale", () => {
    expect(isSupportedLocale("en_US")).toBe(true);
    expect(isSupportedLocale("ja_JP")).toBe(true);
    expect(isSupportedLocale("zh_CN")).toBe(true);
  });

  it("rejects a locale outside the supported list", () => {
    expect(isSupportedLocale("de_DE")).toBe(false);
  });
});

describe("getDefaultLocale", () => {
  const ORIGINAL_ENV = process.env.DEFAULT_LOCALE;

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.DEFAULT_LOCALE;
    } else {
      process.env.DEFAULT_LOCALE = ORIGINAL_ENV;
    }
  });

  it("[AC-1] is en_US when no deployment configuration is set", () => {
    delete process.env.DEFAULT_LOCALE;
    expect(getDefaultLocale()).toBe("en_US");
  });

  it("reads the deployment configuration when it is set", () => {
    process.env.DEFAULT_LOCALE = "ja_JP";
    expect(getDefaultLocale()).toBe("ja_JP");
  });
});

describe("parseLocale", () => {
  beforeEach(() => {
    delete process.env.DEFAULT_LOCALE;
  });

  it("[AC-2] interprets a two-part identifier as that language and country", () => {
    expect(parseLocale("ja_JP")).toEqual({ id: "ja_JP", language: "ja", country: "JP" });
  });

  it("[AC-3] interprets the literal default, compared case-insensitively, as the server's default locale", () => {
    process.env.DEFAULT_LOCALE = "zh_CN";
    expect(parseLocale("default")).toEqual({ id: "zh_CN", language: "zh", country: "CN" });
    expect(parseLocale("DEFAULT")).toEqual({ id: "zh_CN", language: "zh", country: "CN" });
    expect(parseLocale("Default")).toEqual({ id: "zh_CN", language: "zh", country: "CN" });
  });

  it("[AC-4] yields no locale for an identifier without a separator", () => {
    expect(parseLocale("en")).toBeNull();
  });

  it("yields no locale for an absent identifier", () => {
    expect(parseLocale(null)).toBeNull();
    expect(parseLocale(undefined)).toBeNull();
    expect(parseLocale("")).toBeNull();
  });

  it("does not rely on any meaning for a three-part identifier", () => {
    expect(parseLocale("en_US_POSIX")).toBeNull();
  });
});
