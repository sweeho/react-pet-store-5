import { describe, expect, it } from "vitest";

import { STORE_NAME } from "./index";

/**
 * UNIT TEST
 *
 * Pins the store branding constant — a page/header pulling this in should
 * show "Pet Store", not the boilerplate placeholder.
 */
describe("STORE_NAME", () => {
  it("is branded Pet Store", () => {
    expect(STORE_NAME).toBe("Pet Store");
  });
});
