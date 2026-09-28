import { describe, expect, it } from "vitest";

import { pickScreenContent, resolveScreen, ScreenNotFoundError } from "./screens";

/**
 * UNIT TEST
 *
 * The per-screen, per-locale resolution rule (D3, SWHR-R-0013): requested
 * locale, else en_US, else "not found". `not-found.ts` is a real registered
 * screen with content in all three supported locales, used here as a stable
 * fixture; `pickScreenContent` is tested directly against literal objects
 * for the "this screen hasn't been translated into an otherwise-installed
 * locale" branch, since no real screen in the registry is missing one.
 */
describe("resolveScreen", () => {
  it("[AC-3] renders the requested locale's own content when the screen has it", () => {
    expect(resolveScreen("not-found", "ja_JP").title).toBe("ページが見つかりません");
    expect(resolveScreen("not-found", "zh_CN").title).toBe("未找到页面");
  });

  it("[AC-4] falls back to en_US when no definitions are installed for the effective locale", () => {
    expect(resolveScreen("not-found", "de_DE").title).toBe("Page not found");
  });

  it("[AC-6] throws ScreenNotFoundError stating the screen name when it is defined nowhere", () => {
    expect(() => resolveScreen("giftcard", "en_US")).toThrow(ScreenNotFoundError);
    expect(() => resolveScreen("giftcard", "en_US")).toThrow(
      "Definition for screen giftcard not found",
    );
  });
});

describe("pickScreenContent", () => {
  it("[AC-3] returns the requested locale's content when the screen defines it", () => {
    const screen = { en_US: { greeting: "Hello" }, ja_JP: { greeting: "こんにちは" } };
    expect(pickScreenContent(screen, "ja_JP")).toEqual({ greeting: "こんにちは" });
  });

  it("[AC-5] falls back to en_US when this screen doesn't define the requested locale", () => {
    const screen = { en_US: { greeting: "Hello" }, ja_JP: { greeting: "こんにちは" } };
    expect(pickScreenContent(screen, "zh_CN")).toEqual({ greeting: "Hello" });
  });

  it("returns undefined for an unregistered screen", () => {
    expect(pickScreenContent(undefined, "en_US")).toBeUndefined();
  });
});
