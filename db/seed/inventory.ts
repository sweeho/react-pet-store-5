import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

import { supplierInventory } from "../schema";

const INITIAL_QUANTITY = 10000;
const ITEM_COUNT = 29;

/** Seeds stock for EST-1 to EST-29 at 10000, once per fresh database. */
export function seedInventory<TSchema extends Record<string, unknown>>(
  db: BunSQLiteDatabase<TSchema>,
): void {
  db.insert(supplierInventory)
    .values(
      Array.from({ length: ITEM_COUNT }, (_, i) => ({
        itemId: `EST-${i + 1}`,
        quantity: INITIAL_QUANTITY,
      })),
    )
    .run();
}
