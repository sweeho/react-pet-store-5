/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs */
import type { PartnerInvoice } from "../b2b/partner/tpaInvoice";
import type { SupplierOrderLineItem, SupplierOrderRecord } from "../b2b/exchange/supplierOrders";

export interface FulfilResult {
  shipped: SupplierOrderLineItem[];
  stock: Record<string, number>;
  completed: boolean;
}

export function fulfil(
  lines: SupplierOrderLineItem[],
  stock: Record<string, number>,
): FulfilResult {
  throw new Error("VortexNotImplemented");
}

export function buildSupplierInvoice(
  order: SupplierOrderRecord,
  shippedLines: SupplierOrderLineItem[],
  now: Date,
): PartnerInvoice {
  throw new Error("VortexNotImplemented");
}
