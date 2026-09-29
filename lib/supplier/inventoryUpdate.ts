import { db } from "../../db/client";
import { listStockRecords } from "./inventory";
import { planStockBatch } from "./stockBatch";
import type { StockBatchPlan, StockBatchRow } from "./stockBatch";
import { applyStockUpdate } from "./stock";

export type UpdateInventoryResult =
  | { ok: true; updated: string[]; invoicedOrderIds: string[] }
  | Extract<StockBatchPlan, { ok: false }>;

/**
 * Plans the batch, writes stock, re-fulfils pending supplier orders and queues
 * their invoices in one transaction. A rejected plan writes nothing; any throw
 * rolls the whole update back.
 */
export function updateInventory(
  rows: StockBatchRow[],
  now: Date = new Date(),
): UpdateInventoryResult {
  return db.transaction((tx) => {
    const known = new Set(listStockRecords(tx).map((r) => r.itemId));
    const plan = planStockBatch(rows, known);
    if (!plan.ok) return plan;
    const invoices = applyStockUpdate(tx, plan.updates, now);
    return {
      ok: true,
      updated: plan.updates.map((u) => u.itemId),
      invoicedOrderIds: invoices.map((i) => i.orderId),
    };
  });
}
