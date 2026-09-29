import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { supplierInventory } from "../../db/schema";
import { createStockRecord, getStockRecord, listStockRecords } from "./inventory";

beforeEach(() => {
  db.delete(supplierInventory).run();
});

describe("supplier stock record", () => {
  it("[SWHR-C-0390] creating stock for EST-1 with 10000 yields one record", () => {
    db.transaction((tx) => createStockRecord(tx, { itemId: "EST-1", quantity: 10000 }));
    expect(listStockRecords().filter((r) => r.itemId === "EST-1")).toEqual([
      { itemId: "EST-1", quantity: 10000 },
    ]);
  });

  it("[SWHR-C-0391] second stock record for EST-1 is refused and original unchanged", () => {
    db.transaction((tx) => createStockRecord(tx, { itemId: "EST-1", quantity: 10000 }));
    expect(() =>
      db.transaction((tx) => createStockRecord(tx, { itemId: "EST-1", quantity: 5 })),
    ).toThrow();
    expect(getStockRecord("EST-1")).toEqual({ itemId: "EST-1", quantity: 10000 });
    expect(listStockRecords()).toHaveLength(1);
  });

  it("[SWHR-C-0392] stock record for EST-2 without quantity is refused", () => {
    expect(() =>
      db.transaction((tx) =>
        // Deliberately omits quantity to exercise the NOT NULL refusal.
        createStockRecord(tx, { itemId: "EST-2" } as unknown as {
          itemId: string;
          quantity: number;
        }),
      ),
    ).toThrow();
    expect(getStockRecord("EST-2")).toBeNull();
  });

  it("lists records in natural item-id order", () => {
    db.transaction((tx) => {
      createStockRecord(tx, { itemId: "EST-10", quantity: 1 });
      createStockRecord(tx, { itemId: "EST-2", quantity: 2 });
    });
    expect(listStockRecords().map((r) => r.itemId)).toEqual(["EST-2", "EST-10"]);
  });
});
