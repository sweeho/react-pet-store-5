import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { supplierInventory } from "../../db/schema";
import { loadInitialStock } from "../../db/seed/inventory";

const stock = () =>
  Object.fromEntries(
    db
      .select()
      .from(supplierInventory)
      .all()
      .map((r) => [r.itemId, r.quantity]),
  );

describe("supplier stock seed", () => {
  it("a fresh database holds EST-1 through EST-29 at 10000", () => {
    const rows = db.select().from(supplierInventory).all();

    expect(rows).toHaveLength(29);
    expect(rows.every((r) => r.quantity === 10000)).toBe(true);
    expect(rows.map((r) => r.itemId)).toContain("EST-29");
  });
});

describe("initial stock load", () => {
  beforeEach(() => {
    db.delete(supplierInventory).run();
  });

  it("[SWHR-C-0401] unforced load into empty inventory creates EST-1..EST-29 at 10000", () => {
    expect(loadInitialStock(db)).toBe("loaded");

    const rows = stock();
    expect(Object.keys(rows)).toHaveLength(29);
    for (let i = 1; i <= 29; i++) expect(rows[`EST-${i}`]).toBe(10000);
  });

  it("[SWHR-C-0402] unforced load is skipped when inventory exists", () => {
    db.insert(supplierInventory).values({ itemId: "EST-1", quantity: 3 }).run();

    expect(loadInitialStock(db)).toBe("skipped");
    expect(stock()).toEqual({ "EST-1": 3 });
  });

  it("[SWHR-C-0403] forced load resets EST-1 to 10000 and creates EST-2..EST-29", () => {
    db.insert(supplierInventory).values({ itemId: "EST-1", quantity: 3 }).run();
    db.insert(supplierInventory).values({ itemId: "EST-99", quantity: 7 }).run();

    expect(loadInitialStock(db, { force: true })).toBe("loaded");

    const rows = stock();
    for (let i = 1; i <= 29; i++) expect(rows[`EST-${i}`]).toBe(10000);
    expect(rows["EST-99"]).toBe(7);
  });
});
