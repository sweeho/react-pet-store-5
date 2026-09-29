/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs */
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

export function setShippedQuantity(
  _tx: Executor,
  _orderId: string,
  _lineNum: number,
  _quantityShipped: number,
): void {
  throw new Error("VortexNotImplemented");
}

export function copyLine(_line: OrderLine, _quantityShipped: number): OrderLine {
  throw new Error("VortexNotImplemented");
}
