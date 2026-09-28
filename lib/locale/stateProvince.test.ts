import { describe, expect, it } from "vitest";

import { getStateProvinceOptions } from "./stateProvince";

describe("getStateProvinceOptions", () => {
  it("[AC-1] returns Tokyo, Osaka and Nagano for ja_JP", () => {
    expect(getStateProvinceOptions("ja_JP").map((option) => option.label)).toEqual([
      "東京",
      "大阪",
      "長野",
    ]);
  });

  it("returns California, New York and Texas for en_US", () => {
    expect(getStateProvinceOptions("en_US").map((option) => option.label)).toEqual([
      "California",
      "New York",
      "Texas",
    ]);
  });

  it("returns Beijing, Shanghai and Jiangsu for zh_CN", () => {
    expect(getStateProvinceOptions("zh_CN").map((option) => option.label)).toEqual([
      "北京",
      "上海",
      "江苏",
    ]);
  });

  it("falls back to the en_US list for an unsupported locale", () => {
    expect(getStateProvinceOptions("de_DE")).toEqual(getStateProvinceOptions("en_US"));
  });
});
