/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs */
export const ORDER_STATUSES = ["PENDING", "APPROVED", "DENIED", "COMPLETED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type Decision = "APPROVED" | "DENIED";

/** One order as shown to the administrator (design.md P6). */
export interface OrderSummary {
  orderId: string;
  userId: string;
  date: string;
  amount: string;
  status: OrderStatus | null;
}

/** A report group with a usable name and value (SWHR-R-0184). */
export interface ReportGroup {
  name: string;
  value: string;
  amount: number;
}

export interface ShareGroup extends ReportGroup {
  percent: string;
}

export interface CommitBatch {
  status: Decision;
  orderIds: string[];
}

export function parseStatus(value: unknown): OrderStatus | null {
  throw new Error("VortexNotImplemented");
}

export function parseOrderSummary(raw: Record<string, unknown>): OrderSummary {
  throw new Error("VortexNotImplemented");
}

export function isValidReportDate(text: string): boolean {
  throw new Error("VortexNotImplemented");
}

export function validGroups(raw: { name?: unknown; value?: unknown }[]): ReportGroup[] {
  throw new Error("VortexNotImplemented");
}

export function commitBatches(marks: Record<string, Decision>): CommitBatch[] {
  throw new Error("VortexNotImplemented");
}

export function percentShares(groups: ReportGroup[]): ShareGroup[] {
  throw new Error("VortexNotImplemented");
}

export function formatAmount(amount: string): string {
  throw new Error("VortexNotImplemented");
}
