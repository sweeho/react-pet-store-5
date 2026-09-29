import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { category, categoryDetails, item, itemDetails, product } from "../../db/schema";
import { formatPrice } from "../locale/money";

/**
 * INTEGRATION TEST
 *
 * Runs against the real (in-memory under Vitest, see db/client.ts) database.
 * Every case inserts directly through `db` to prove the constraint lives in
 * the schema itself, not in application code.
 */
describe("category schema constraints", () => {
  it("[SWHR-C-0149] rejects category details saved without a name", () => {
    db.insert(category).values({ id: "SCHM-CAT1" }).run();

    // Raw SQL, not the typed insert builder: `name` is required at the type
    // level too, but this proves the database column itself is NOT NULL.
    expect(() =>
      db.run(
        sql`INSERT INTO categoryDetails (categoryId, locale, name) VALUES ('SCHM-CAT1', 'en_US', NULL)`,
      ),
    ).toThrow();
  });

  it("[SWHR-C-0150] rejects a second details row for the same category and locale", () => {
    db.insert(category).values({ id: "SCHM-CAT2" }).run();
    db.insert(categoryDetails)
      .values({ categoryId: "SCHM-CAT2", locale: "en_US", name: "First" })
      .run();

    expect(() =>
      db
        .insert(categoryDetails)
        .values({ categoryId: "SCHM-CAT2", locale: "en_US", name: "Second" })
        .run(),
    ).toThrow();
  });
});

describe("product schema constraints", () => {
  it("[SWHR-C-0152] rejects a product referencing a missing category", () => {
    expect(() =>
      db.insert(product).values({ id: "SCHM-PR1", categoryId: "LIZARDS" }).run(),
    ).toThrow();
  });
});

describe("item schema constraints", () => {
  it("[SWHR-C-0153] stores item prices as exact decimals, without floating-point rounding", () => {
    db.insert(category).values({ id: "SCHM-CAT6" }).run();
    db.insert(product).values({ id: "SCHM-PR2", categoryId: "SCHM-CAT6" }).run();
    db.insert(item).values({ id: "SCHM-IT1", productId: "SCHM-PR2" }).run();
    db.insert(itemDetails)
      .values({
        itemId: "SCHM-IT1",
        locale: "en_US",
        name: "Test Item",
        description: "A test item",
        image: "test.gif",
        listPrice: 1850,
        unitCost: 1200,
      })
      .run();

    const row = db.select().from(itemDetails).where(eq(itemDetails.itemId, "SCHM-IT1")).get();

    expect(formatPrice(row!.listPrice, "en_US")).toBe("$18.50");
    expect(formatPrice(row!.unitCost, "en_US")).toBe("$12.00");
  });

  it("[SWHR-C-0154] rejects item details saved without a unit cost", () => {
    db.insert(category).values({ id: "SCHM-CAT7" }).run();
    db.insert(product).values({ id: "SCHM-PR3", categoryId: "SCHM-CAT7" }).run();
    db.insert(item).values({ id: "SCHM-IT2", productId: "SCHM-PR3" }).run();

    // Raw SQL, not the typed insert builder: `unitCost` is required at the
    // type level too, but this proves the database column itself is NOT NULL.
    expect(() =>
      db.run(
        sql`INSERT INTO itemDetails (itemId, locale, name, description, image, listPrice, unitCost) VALUES ('SCHM-IT2', 'en_US', 'Test Item', 'A test item', 'test.gif', 1850, NULL)`,
      ),
    ).toThrow();
  });
});
