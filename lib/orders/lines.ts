import { and, eq } from "drizzle-orm";

import { orderLines } from "../../db/schema";
import type { Executor } from "../account/types";

export interface OrderLine {
  lineNum: number;
  categoryId: string;
  productId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  quantityShipped: number;
}

/** The only line update: item, quantity, price, category, product and line number are fixed. */
export function setShippedQuantity(
  tx: Executor,
  orderId: string,
  lineNum: number,
  quantityShipped: number,
): void {
  tx.update(orderLines)
    .set({ quantityShipped })
    .where(and(eq(orderLines.orderId, orderId), eq(orderLines.lineNum, lineNum)))
    .run();
}

/** Builds a line from another; the shipped quantity must be stated. */
export function copyLine(line: OrderLine, quantityShipped: number): OrderLine {
  return { ...line, quantityShipped };
}
