import { describe, expect, it, vi } from "vitest";

import { db } from "../../db/client";
import { withReadTransaction } from "./readTransaction";

describe("withReadTransaction", () => {
  it("runs the read inside a transaction and returns its result", () => {
    expect(
      withReadTransaction((tx) => tx.all({ sql: "select 1 as n", params: [] } as never)),
    ).toBeDefined();
  });

  it("[SWHR-C-0286] falls back to the plain connection when no transaction can begin", () => {
    const spy = vi.spyOn(db, "transaction").mockImplementation(() => {
      throw new Error("cannot start a transaction");
    });
    try {
      expect(withReadTransaction((tx) => (tx === db ? "plain" : "tx"))).toBe("plain");
    } finally {
      spy.mockRestore();
    }
  });

  it("rethrows an error from the read itself", () => {
    expect(() =>
      withReadTransaction(() => {
        throw new Error("boom");
      }),
    ).toThrow("boom");
  });
});
