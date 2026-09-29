export interface StockBatchRow {
  itemId: string;
  update: boolean;
  quantity: string;
}

export type StockBatchPlan =
  | { ok: true; updates: { itemId: string; quantity: number }[] }
  | { ok: false; invalid: string[]; unknown: string[] };

export function planStockBatch(
  rows: readonly StockBatchRow[],
  knownItemIds: ReadonlySet<string>,
): StockBatchPlan {
  void [rows, knownItemIds];
  throw new Error("VortexNotImplemented");
}
