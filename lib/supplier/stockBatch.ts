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
  const updates: { itemId: string; quantity: number }[] = [];
  const invalid: string[] = [];
  const unknown: string[] = [];

  for (const { itemId, update, quantity } of rows) {
    if (!update) continue;
    const text = quantity.trim();
    if (text === "") continue;
    if (!/^-?\d+$/.test(text)) {
      invalid.push(itemId);
      continue;
    }
    const value = Number(text);
    if (value < 0) continue;
    if (!knownItemIds.has(itemId)) {
      unknown.push(itemId);
      continue;
    }
    updates.push({ itemId, quantity: value });
  }

  return invalid.length > 0 || unknown.length > 0
    ? { ok: false, invalid, unknown }
    : { ok: true, updates };
}
