import type { SupplierOrderLineItem, SupplierOrderRecord } from "../b2b/exchange/supplierOrders";
import type { PartnerInvoice } from "../b2b/partner/tpaInvoice";

export interface FulfilResult {
  shipped: SupplierOrderLineItem[];
  stock: Record<string, number>;
  completed: boolean;
}

/**
 * Pure whole-line shipment. Only unshipped lines are evaluated, in ascending
 * line number; a line ships whole when stock for its item covers its full
 * quantity, and a missing stock record counts as 0. `completed` is true when
 * every line is shipped once this attempt is applied.
 */
export function fulfil(
  lines: SupplierOrderLineItem[],
  stock: Record<string, number>,
): FulfilResult {
  const remaining = { ...stock };
  const shipped: SupplierOrderLineItem[] = [];
  const ordered = [...lines].sort((a, b) => a.lineNum - b.lineNum);
  for (const line of ordered) {
    if (line.quantityShipped >= line.quantity) continue;
    const onHand = remaining[line.itemId] ?? 0;
    if (onHand < line.quantity) continue;
    remaining[line.itemId] = onHand - line.quantity;
    shipped.push(line);
  }
  const completed = ordered.every((l) => l.quantityShipped >= l.quantity || shipped.includes(l));
  return { shipped, stock: remaining, completed };
}

/** Invoice for one shipment attempt: original order date, shipping date `now`, shipped lines only. */
export function buildSupplierInvoice(
  order: SupplierOrderRecord,
  shippedLines: SupplierOrderLineItem[],
  now: Date,
): PartnerInvoice {
  return {
    orderId: order.orderId,
    userId: "Dear PetStore Customer",
    orderDate: order.orderDate,
    shippingDate: now,
    lineItems: shippedLines.map((l) => ({
      categoryId: l.categoryId,
      productId: l.productId,
      itemId: l.itemId,
      lineNum: l.lineNum,
      quantity: l.quantity,
      unitPrice: (l.unitPrice / 100).toFixed(2),
    })),
  };
}
