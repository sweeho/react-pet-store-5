import { defineHandler, readBody } from "nitro/h3";

import { requireRole } from "../../../lib/auth/roles";
import { updateInventory } from "../../../lib/supplier/inventoryUpdate";
import type { StockBatchRow } from "../../../lib/supplier/stockBatch";

function isBatchRow(value: unknown): value is StockBatchRow {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.itemId === "string" &&
    typeof row.update === "boolean" &&
    typeof row.quantity === "string"
  );
}

/** design.md P4: every screen row arrives; the server owns the selection rule (SD-3). */
export default defineHandler(async (event) => {
  await requireRole(event, "supplier", "administrator");

  const body = await readBody<{ rows?: unknown }>(event).catch(() => null);
  const rows = body?.rows;
  if (!Array.isArray(rows) || !rows.every(isBatchRow)) {
    event.res.status = 400;
    return { error: "INVALID_BATCH", invalid: [], unknown: [] };
  }

  try {
    const result = updateInventory(rows);
    if (!result.ok) {
      event.res.status = 400;
      return { error: "INVALID_BATCH", invalid: result.invalid, unknown: result.unknown };
    }
    event.res.status = 200;
    return { updated: result.updated };
  } catch {
    event.res.status = 500;
    return { error: "INVENTORY_UPDATE_FAILED" };
  }
});
