import type { StockBatchPlan, StockBatchRow } from "./stockBatch";

export type UpdateInventoryResult =
  | { ok: true; updated: string[]; invoicedOrderIds: string[] }
  | Extract<StockBatchPlan, { ok: false }>;

export function updateInventory(
  rows: StockBatchRow[],
  now: Date = new Date(),
): UpdateInventoryResult {
  void [rows, now];
  throw new Error("VortexNotImplemented");
}
