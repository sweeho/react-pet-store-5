import { and, asc, eq, gte, lte } from "drizzle-orm";

import { db } from "../../db/client";
import {
  categoryDetails,
  orderContacts,
  orderLines,
  orderWorkflow,
  purchaseOrders,
} from "../../db/schema";
import { writeOrderApproval, type ApprovalEntry } from "../b2b/documents/orderApproval";
import { enqueue } from "../messaging/outbox";
import { minorToDecimal } from "./money";

export interface OrderSummary {
  orderId: string;
  userId: string;
  date: string;
  amount: string;
  status: string;
}

/** SWHR-R-0191 / SD-11: M/D/YYYY without padding, in UTC. */
function formatDate(date: Date): string {
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}`;
}

/** Orders in `status` by orderId; an order without its contact row fails the request. */
export function listOrdersByStatus(status: string): { orders: OrderSummary[]; total: number } {
  const rows = db
    .select({
      orderId: purchaseOrders.orderId,
      userId: purchaseOrders.userId,
      orderDate: purchaseOrders.orderDate,
      locale: purchaseOrders.locale,
      totalValue: purchaseOrders.totalValue,
      status: orderWorkflow.status,
      contactId: orderContacts.id,
    })
    .from(purchaseOrders)
    .innerJoin(orderWorkflow, eq(orderWorkflow.orderId, purchaseOrders.orderId))
    .leftJoin(orderContacts, eq(orderContacts.orderId, purchaseOrders.orderId))
    .where(eq(orderWorkflow.status, status))
    .orderBy(asc(purchaseOrders.orderId))
    .all();

  const orders = rows.map((row) => {
    if (row.contactId === null) {
      throw new Error(`Order ${row.orderId} has no contact details.`);
    }
    return {
      orderId: row.orderId,
      userId: row.userId,
      date: formatDate(row.orderDate),
      amount: minorToDecimal(row.totalValue, row.locale),
      status: row.status,
    };
  });
  return { orders, total: orders.length };
}

function toEntry(raw: unknown): ApprovalEntry | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { orderId, status } = raw as { orderId?: unknown; status?: unknown };
  if (typeof orderId !== "string" || orderId === "") return null;
  if (status !== "APPROVED" && status !== "DENIED") return null;
  return { orderId, status };
}

/** Queues one OrderApproval document with the valid entries; no status changes here. */
export function queueDecisions(entries: unknown[]): number {
  const valid = entries.map(toEntry).filter((e): e is ApprovalEntry => e !== null);
  if (valid.length === 0) return 0;
  const document = writeOrderApproval(valid);
  db.transaction((tx) => {
    enqueue(tx, "opc.order-approval", document);
  });
  return valid.length;
}

/** Strict MM/dd/yyyy as a UTC midnight, or null. */
export function parseReportDate(text: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return null;
  const [month, day, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function formatHundredths(value: number): string {
  const padded = String(value).padStart(3, "0");
  return `${padded.slice(0, -2)}.${padded.slice(-2)}`;
}

/**
 * design.md P6: every status, inclusive window (SD-7). REVENUE sums in
 * hundredths so locales add exactly (SD-8); ORDERS sums quantities.
 */
export function salesReport(
  kind: "REVENUE" | "ORDERS",
  start: Date,
  end: Date,
  category?: string,
): { groups: { name: string; value: string }[]; total: string } {
  const windowEnd = new Date(end.getTime() + DAY_MS - 1);
  const lines = db
    .select({
      categoryId: orderLines.categoryId,
      itemId: orderLines.itemId,
      quantity: orderLines.quantity,
      unitPrice: orderLines.unitPrice,
      locale: purchaseOrders.locale,
    })
    .from(orderLines)
    .innerJoin(purchaseOrders, eq(purchaseOrders.orderId, orderLines.orderId))
    .where(and(gte(purchaseOrders.orderDate, start), lte(purchaseOrders.orderDate, windowEnd)))
    .all()
    .filter((line) => category === undefined || line.categoryId === category);

  const names = new Map(
    db
      .select({ id: categoryDetails.categoryId, name: categoryDetails.name })
      .from(categoryDetails)
      .where(eq(categoryDetails.locale, "en_US"))
      .all()
      .map((row) => [row.id, row.name]),
  );

  const sums = new Map<string, number>();
  let total = 0;
  for (const line of lines) {
    const scale = minorToDecimal(1, line.locale).includes(".") ? 1 : 100;
    const amount = kind === "REVENUE" ? line.quantity * line.unitPrice * scale : line.quantity;
    const name =
      category === undefined ? (names.get(line.categoryId) ?? line.categoryId) : line.itemId;
    sums.set(name, (sums.get(name) ?? 0) + amount);
    total += amount;
  }

  const format = kind === "REVENUE" ? formatHundredths : String;
  const groups = [...sums.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([name, value]) => ({ name, value: format(value) }));
  return { groups, total: format(total) };
}
