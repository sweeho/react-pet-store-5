import { describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { supplierInventory } from "../../db/schema";

describe("supplier stock seed", () => {
  it("a fresh database holds EST-1 through EST-29 at 10000", () => {
    const rows = db.select().from(supplierInventory).all();

    expect(rows).toHaveLength(29);
    expect(rows.every((r) => r.quantity === 10000)).toBe(true);
    expect(rows.map((r) => r.itemId)).toContain("EST-29");
  });
});
