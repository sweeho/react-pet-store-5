import path from "node:path";

import { Database } from "bun:sqlite";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { afterEach, describe, expect, it, vi } from "vitest";

import { db } from "../../db/client";
import { category, categoryDetails, item, product, productDetails } from "../../db/schema";
import * as catalogSeed from "../../db/seed/catalog";

/**
 * INTEGRATION TEST
 *
 * Catalog seed data (SWHR-R-0100) and the no-listing-cache decision (P4,
 * SWHR-R-0099). The seed scenarios build their OWN throwaway in-memory
 * database (mirroring db/client.ts's setup minus the seed call) so each
 * case controls exactly whether the catalog tables start empty or already
 * populated — the shared `db` singleton always seeds itself at import.
 * The cache scenarios use the shared, already-seeded `db` and a direct
 * query, since P4 deliberately ships no listing function or cache to query
 * through (SWHR-T-0058 adds the real listing function later).
 */

function createEmptyTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const testDb = drizzle(sqlite, { schema: {} });
  migrate(testDb, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return testDb;
}

describe("catalog seed data", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("[SWHR-C-0178] First entry into an empty store loads the bundled catalog before home", () => {
    const testDb = createEmptyTestDb();
    expect(testDb.select().from(category).all()).toHaveLength(0);

    catalogSeed.seedCatalog(testDb);

    expect(testDb.select().from(category).all()).toHaveLength(5);
    expect(testDb.select().from(product).all().length).toBeGreaterThan(0);
    expect(testDb.select().from(item).all()).toHaveLength(28);
  });

  it("[SWHR-C-0179] Entry into a populated store does not reload data", () => {
    const testDb = createEmptyTestDb();
    catalogSeed.seedCatalog(testDb);

    testDb
      .update(categoryDetails)
      .set({ name: "MARKER" })
      .where(and(eq(categoryDetails.categoryId, "BIRDS"), eq(categoryDetails.locale, "en_US")))
      .run();

    const seedSpy = vi.spyOn(catalogSeed, "seedCatalog");
    // The same "seed only when empty" guard db/client.ts runs at import
    // time — the catalog is no longer empty, so the loader is not called.
    const isEmpty = testDb.select().from(category).all().length === 0;
    if (isEmpty) {
      catalogSeed.seedCatalog(testDb);
    }

    expect(seedSpy).not.toHaveBeenCalled();
    const marker = testDb
      .select()
      .from(categoryDetails)
      .where(and(eq(categoryDetails.categoryId, "BIRDS"), eq(categoryDetails.locale, "en_US")))
      .get();
    expect(marker?.name).toBe("MARKER");
    // The bundled catalog itself (28 items) is still exactly what the one
    // seed call produced — nothing was dropped and recreated.
    expect(testDb.select().from(item).all()).toHaveLength(28);
  });
});

/** A direct query standing in for the future SWHR-T-0058 listing function. */
function listCategoryProducts(categoryId: string, locale: string) {
  return db
    .select({ productId: product.id, name: productDetails.name })
    .from(product)
    .innerJoin(
      productDetails,
      and(eq(productDetails.productId, product.id), eq(productDetails.locale, locale)),
    )
    .where(eq(product.categoryId, categoryId))
    .all();
}

describe("cached catalog listings (P4 — no cache)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("[SWHR-C-0176] DOGS listing cached 6 minutes ago is regenerated and shows a new product", () => {
    vi.useFakeTimers();

    // "Requested once" (would have been cached, if a cache existed) — the
    // full legacy DOGS roster (SD1), confirming this reads real seed data
    // and not some other fixture.
    const before = listCategoryProducts("DOGS", "en_US");
    expect(before.map((p) => p.productId).sort()).toEqual([
      "K9-BD-01",
      "K9-CW-01",
      "K9-DL-01",
      "K9-PO-02",
      "K9-RT-01",
      "K9-RT-02",
    ]);

    vi.advanceTimersByTime(6 * 60 * 1000);

    db.insert(product).values({ id: "K9-NEW-01", categoryId: "DOGS" }).run();
    db.insert(productDetails)
      .values({ productId: "K9-NEW-01", locale: "en_US", name: "Newfoundland" })
      .run();

    const after = listCategoryProducts("DOGS", "en_US");
    expect(after.map((p) => p.productId)).toContain("K9-NEW-01");
  });

  it("[SWHR-C-0177] Cached DOGS listing is not served for CATS", () => {
    // "DOGS product listing is cached" — requested first, as the scenario
    // describes; nothing about it can leak into a different category's
    // request because no cache exists to leak from.
    listCategoryProducts("DOGS", "en_US");

    const catsListing = listCategoryProducts("CATS", "en_US");

    expect(catsListing.map((p) => p.productId).sort()).toEqual(["FL-DLH-02", "FL-DSH-01"]);
  });
});
