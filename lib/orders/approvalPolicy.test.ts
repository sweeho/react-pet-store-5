import { describe, expect, it } from "vitest";

import { AUTO_APPROVAL_THRESHOLDS } from "./approvalPolicy";

describe("AUTO_APPROVAL_THRESHOLDS", () => {
  it("pins the per-locale thresholds in minor units", () => {
    expect(AUTO_APPROVAL_THRESHOLDS).toEqual({ en_US: 50000, ja_JP: 50000, zh_CN: null });
  });
});
