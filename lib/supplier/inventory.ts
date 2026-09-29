import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import { supplierInventory } from "../../db/schema";
import type { Executor } from "../account/types";
import type { Tx } from "../messaging/outbox";

export interface StockRecord {
  itemId: string;
  quantity: number;
}

/** Every stock record, in natural item-id order (EST-2 before EST-10). */
export function listStockRecords(executor: Executor = db): StockRecord[] {
  return executor
    .select()
    .from(supplierInventory)
    .all()
    .sort((a, b) => a.itemId.localeCompare(b.itemId, undefined, { numeric: true }));
}

export function getStockRecord(itemId: string, executor: Executor = db): StockRecord | null {
  return (
    executor.select().from(supplierInventory).where(eq(supplierInventory.itemId, itemId)).get() ??
    null
  );
}

/** Plain insert: the primary key and NOT NULL refuse a duplicate id or a missing quantity. */
export function createStockRecord(tx: Tx, record: StockRecord): void {
  tx.insert(supplierInventory).values(record).run();
}
