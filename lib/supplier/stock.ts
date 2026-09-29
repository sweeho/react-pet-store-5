import { and, eq, inArray } from "drizzle-orm";

import { supplierInventory, supplierLineItems, supplierOrders } from "../../db/schema";
import { getSupplierOrder } from "../b2b/exchange/supplierOrders";
import { publishInvoices } from "../b2b/exchange/invoiceChannel";
import type { PartnerInvoice } from "../b2b/partner/tpaInvoice";
import type { Tx } from "../messaging/outbox";
import { InvoiceBuildError } from "./errors";
import { buildSupplierInvoice, fulfil } from "./fulfilment";

/**
 * Ships every line of a PENDING supplier order that stock covers, in the
 * caller's transaction: stock decrements, shipped quantities and COMPLETED.
 * Returns the invoice for this attempt, or null when nothing shipped.
 */
export function fulfilSupplierOrder(tx: Tx, orderId: string, now: Date): PartnerInvoice | null {
  const order = getSupplierOrder(orderId, tx);
  if (!order || order.status !== "PENDING") return null;

  const itemIds = [...new Set(order.lineItems.map((l) => l.itemId))];
  const stock: Record<string, number> = {};
  if (itemIds.length > 0) {
    for (const row of tx
      .select()
      .from(supplierInventory)
      .where(inArray(supplierInventory.itemId, itemIds))
      .all()) {
      stock[row.itemId] = row.quantity;
    }
  }

  const result = fulfil(order.lineItems, stock);
  if (result.shipped.length === 0) return null;

  let invoice: PartnerInvoice;
  try {
    invoice = buildSupplierInvoice(order, result.shipped, now);
  } catch (error) {
    throw new InvoiceBuildError(error);
  }
  for (const itemId of Object.keys(stock)) {
    if (result.stock[itemId] !== stock[itemId]) {
      tx.update(supplierInventory)
        .set({ quantity: result.stock[itemId] })
        .where(eq(supplierInventory.itemId, itemId))
        .run();
    }
  }
  for (const line of result.shipped) {
    tx.update(supplierLineItems)
      .set({ quantityShipped: line.quantity })
      .where(
        and(eq(supplierLineItems.orderId, orderId), eq(supplierLineItems.lineNum, line.lineNum)),
      )
      .run();
  }
  if (result.completed) {
    tx.update(supplierOrders)
      .set({ status: "COMPLETED" })
      .where(eq(supplierOrders.orderId, orderId))
      .run();
  }
  return invoice;
}

/**
 * Retries every PENDING supplier order in ascending order id, each in its own
 * savepoint: an order whose invoice build fails is rolled back and skipped
 * (SWHR-R-0220.02). Any other failure propagates and aborts the caller's update.
 */
export function refulfilPendingSupplierOrders(tx: Tx, now: Date): PartnerInvoice[] {
  const invoices: PartnerInvoice[] = [];
  for (const orderId of listPendingIds(tx)) {
    try {
      const invoice = tx.transaction((inner) => fulfilSupplierOrder(inner, orderId, now));
      if (invoice) invoices.push(invoice);
    } catch (error) {
      if (!(error instanceof InvoiceBuildError)) throw error;
      // Rolled back to the savepoint; the order stays PENDING for the next stock update.
    }
  }
  return invoices;
}

function listPendingIds(tx: Tx): string[] {
  return tx
    .select({ orderId: supplierOrders.orderId })
    .from(supplierOrders)
    .where(eq(supplierOrders.status, "PENDING"))
    .orderBy(supplierOrders.orderId)
    .all()
    .map((r) => r.orderId);
}

/** Sets absolute stock quantities, re-fulfils pending supplier orders and publishes their invoices. */
export function applyStockUpdate(
  tx: Tx,
  updates: { itemId: string; quantity: number }[],
  now: Date,
): PartnerInvoice[] {
  for (const { itemId, quantity } of updates) {
    tx.insert(supplierInventory)
      .values({ itemId, quantity })
      .onConflictDoUpdate({ target: supplierInventory.itemId, set: { quantity } })
      .run();
  }
  const invoices = refulfilPendingSupplierOrders(tx, now);
  publishInvoices(tx, invoices);
  return invoices;
}
