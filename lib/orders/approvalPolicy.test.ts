import { describe, expect, it } from "vitest";

import { AUTO_APPROVAL_THRESHOLDS, shouldAutoApprove } from "./approvalPolicy";

describe("AUTO_APPROVAL_THRESHOLDS", () => {
  it("pins the per-locale thresholds in minor units", () => {
    expect(AUTO_APPROVAL_THRESHOLDS).toEqual({ en_US: 50000, ja_JP: 50000, zh_CN: null });
  });
});

describe("shouldAutoApprove", () => {
  it.each([
    ["en_US", 49999, true],
    ["en_US", 50000, false],
    ["ja_JP", 49999, true],
    ["ja_JP", 50000, false],
    ["zh_CN", 1, false],
    ["fr_FR", 1, false],
  ])("%s total %d gives %s", (locale, total, expected) => {
    expect(shouldAutoApprove(locale, total)).toBe(expected);
  });
});
