/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs */
import type { Executor } from "../account/types";

export type OrderStatus = "PENDING" | "APPROVED" | "DENIED" | "SHIPPED_PART" | "COMPLETED";

export function startTracking(_tx: Executor, _orderId: string): void {
  throw new Error("VortexNotImplemented");
}

export function getStatus(_tx: Executor, _orderId: string): OrderStatus {
  throw new Error("VortexNotImplemented");
}

export function updateStatus(_tx: Executor, _orderId: string, _status: OrderStatus): void {
  throw new Error("VortexNotImplemented");
}

export function transition(_tx: Executor, _orderId: string, _to: OrderStatus): boolean {
  throw new Error("VortexNotImplemented");
}

export function listOrderIdsByStatus(_tx: Executor, _status: OrderStatus): string[] {
  throw new Error("VortexNotImplemented");
}
