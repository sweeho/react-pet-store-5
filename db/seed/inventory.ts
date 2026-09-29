import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

import { supplierInventory } from "../schema";

const INITIAL_QUANTITY = 10000;
const ITEM_COUNT = 29;

/**
 * Initial stock load: EST-1 to EST-29 at 10000.
 *
 * Unforced, it loads only when no stock record exists and otherwise returns
 * "skipped" without touching anything. Forced, it upserts the seeded items back
 * to 10000 and leaves any other item alone.
 *
 * A forced load has no HTTP entry point, deliberately: it overwrites live stock
 * and nothing under `routes/` may call it (R1). It is an operator/test-only path.
 */
export function loadInitialStock<TSchema extends Record<string, unknown>>(
  db: BunSQLiteDatabase<TSchema>,
  { force = false }: { force?: boolean } = {},
): "loaded" | "skipped" {
  if (!force && db.select().from(supplierInventory).limit(1).all().length > 0) {
    return "skipped";
  }

  db.insert(supplierInventory)
    .values(
      Array.from({ length: ITEM_COUNT }, (_, i) => ({
        itemId: `EST-${i + 1}`,
        quantity: INITIAL_QUANTITY,
      })),
    )
    .onConflictDoUpdate({
      target: supplierInventory.itemId,
      set: { quantity: INITIAL_QUANTITY },
    })
    .run();
  return "loaded";
}
