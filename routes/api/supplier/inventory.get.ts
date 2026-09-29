import { defineHandler } from "nitro/h3";

import { requireRole } from "../../../lib/auth/roles";
import { listStockRecords } from "../../../lib/supplier/inventory";

/** design.md P4: a failed lookup is a distinguishable 500, not an empty list. */
export default defineHandler(async (event) => {
  await requireRole(event, "supplier", "administrator");

  try {
    return { items: listStockRecords() };
  } catch {
    event.res.status = 500;
    return { error: "INVENTORY_UNAVAILABLE" };
  }
});
