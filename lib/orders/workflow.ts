import { and, eq, inArray } from "drizzle-orm";

import { orderWorkflow } from "../../db/schema";
import type { Executor } from "../account/types";
import { OrderNotFoundError, WorkflowCreateError } from "./errors";

export type OrderStatus = "PENDING" | "APPROVED" | "DENIED" | "SHIPPED_PART" | "COMPLETED";

/** The statuses each status may move to through `transition`. */
const ALLOWED_FROM: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [],
  APPROVED: ["PENDING"],
  DENIED: ["PENDING"],
  SHIPPED_PART: ["APPROVED", "SHIPPED_PART"],
  COMPLETED: ["APPROVED", "SHIPPED_PART"],
};

/** Inserts a PENDING record; a known order throws `WorkflowCreateError`. */
export function startTracking(tx: Executor, orderId: string): void {
  const created = tx
    .insert(orderWorkflow)
    .values({ orderId, status: "PENDING" })
    .onConflictDoNothing()
    .returning({ orderId: orderWorkflow.orderId })
    .get();
  if (!created) throw new WorkflowCreateError(orderId);
}

export function getStatus(tx: Executor, orderId: string): OrderStatus {
  const row = tx
    .select({ status: orderWorkflow.status })
    .from(orderWorkflow)
    .where(eq(orderWorkflow.orderId, orderId))
    .get();
  if (!row) throw new OrderNotFoundError(orderId);
  return row.status as OrderStatus; // the table's CHECK limits the column to OrderStatus values
}

/** Unguarded overwrite (SWHR-R-0203); never inserts. */
export function updateStatus(tx: Executor, orderId: string, status: OrderStatus): void {
  const row = tx
    .update(orderWorkflow)
    .set({ status })
    .where(eq(orderWorkflow.orderId, orderId))
    .returning({ orderId: orderWorkflow.orderId })
    .get();
  if (!row) throw new OrderNotFoundError(orderId);
}

/** Conditional update along the lifecycle; false when the order is unknown or not in an allowed state. */
export function transition(tx: Executor, orderId: string, to: OrderStatus): boolean {
  const row = tx
    .update(orderWorkflow)
    .set({ status: to })
    .where(and(eq(orderWorkflow.orderId, orderId), inArray(orderWorkflow.status, ALLOWED_FROM[to])))
    .returning({ orderId: orderWorkflow.orderId })
    .get();
  return row !== undefined;
}

export function listOrderIdsByStatus(tx: Executor, status: OrderStatus): string[] {
  return tx
    .select({ orderId: orderWorkflow.orderId })
    .from(orderWorkflow)
    .where(eq(orderWorkflow.status, status))
    .orderBy(orderWorkflow.orderId)
    .all()
    .map((r) => r.orderId);
}
