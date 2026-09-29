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

/** SWHR-R-0167.02: anything but the four known statuses is absent, never mapped. */
export function parseStatus(value: unknown): OrderStatus | null {
  return ORDER_STATUSES.find((status) => status === value) ?? null;
}

export function parseOrderSummary(raw: Record<string, unknown>): OrderSummary {
  return {
    orderId: String(raw.orderId ?? ""),
    userId: String(raw.userId ?? ""),
    date: String(raw.date ?? ""),
    amount: String(raw.amount ?? ""),
    status: parseStatus(raw.status),
  };
}

/** Strict `MM/dd/yyyy`, and a real calendar date. */
export function isValidReportDate(text: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) {
    return false;
  }
  const [month, day, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** SWHR-R-0184: drops a group with no name or a negative or unparseable value. */
export function validGroups(raw: { name?: unknown; value?: unknown }[]): ReportGroup[] {
  const groups: ReportGroup[] = [];
  for (const entry of raw) {
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    const value = typeof entry.value === "string" ? entry.value.trim() : "";
    const amount = value === "" ? Number.NaN : Number(value);
    if (name !== "" && Number.isFinite(amount) && amount >= 0) {
      groups.push({ name, value, amount });
    }
  }
  return groups;
}

/** The approvals first, then the denials; an empty group is skipped. */
export function commitBatches(marks: Record<string, Decision>): CommitBatch[] {
  const batches: CommitBatch[] = [];
  for (const status of ["APPROVED", "DENIED"] as const) {
    const orderIds = Object.keys(marks)
      .filter((orderId) => marks[orderId] === status)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (orderIds.length > 0) {
      batches.push({ status, orderIds });
    }
  }
  return batches;
}

/** Each group's share of the total, to one decimal, without a trailing ".0". */
export function percentShares(groups: ReportGroup[]): ShareGroup[] {
  const total = groups.reduce((sum, group) => sum + group.amount, 0);
  return groups.map((group) => {
    const share = total > 0 ? (group.amount / total) * 100 : 0;
    return { ...group, percent: `${share.toFixed(1).replace(/\.0$/, "")}%` };
  });
}

/** Thousands separators in the integer part; the fraction is kept as sent. */
export function formatAmount(amount: string): string {
  const match = /^(-?)(\d+)(\.\d+)?$/.exec(amount);
  if (!match) {
    return amount;
  }
  return `${match[1]}${match[2].replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${match[3] ?? ""}`;
}

/** Substitutes `{name}` placeholders in an admin string template. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
