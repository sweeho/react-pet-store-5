import { describe, expect, it } from "vitest";

import { escapeHtml } from "./html";

/** UNIT TEST — the escape helper used for every interpolated e-mail value. */
describe("escapeHtml", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;",
    );
  });

  it("leaves plain text alone", () => {
    expect(escapeHtml("FI-SW-01 $16.50")).toBe("FI-SW-01 $16.50");
  });
});
