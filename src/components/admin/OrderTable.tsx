import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from "lucide-react";
import type { ReactElement } from "react";

import { useAdminStrings } from "@/i18n/admin/useAdminStrings";
import { cn } from "@/utils";

import {
  type Decision,
  fill,
  formatAmount,
  type OrderStatus,
  type OrderSummary,
} from "./orderData";

type SortKey = "orderId" | "userId" | "date" | "amount" | "status";

interface Sort {
  key: SortKey;
  direction: "ascending" | "descending";
}

export interface OrderTableProps {
  orders: OrderSummary[];
  /** Decisions not yet committed, by order id; they replace the shown status. */
  marks?: Record<string, Decision>;
  /** Only the pending view is editable; a read-only table renders no controls. */
  editable?: boolean;
  selected?: ReadonlySet<string>;
  disabled?: boolean;
  onToggle?: (orderId: string) => void;
  onToggleAll?: () => void;
  onStatusChange?: (orderId: string, status: "PENDING" | Decision) => void;
}

// DESIGN.md §Status colours.
const STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
  DENIED: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  COMPLETED: "bg-background-2 text-foreground",
};
const OTHER_STATUS_CLASS = "bg-background-2 text-foreground";

function dateValue(text: string): number {
  const [month, day, year] = text.split("/").map(Number);
  return Date.UTC(year, month - 1, day);
}

function sortValue(order: OrderSummary, key: SortKey): string | number {
  switch (key) {
    case "date":
      return dateValue(order.date);
    case "amount":
      return Number(order.amount.replace(/,/g, ""));
    case "status":
      return order.status ?? "";
    case "orderId":
      return order.orderId;
    case "userId":
      return order.userId;
  }
}

function compare(a: OrderSummary, b: OrderSummary, key: SortKey): number {
  const left = sortValue(a, key);
  const right = sortValue(b, key);
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }
  return String(left).localeCompare(String(right), undefined, { numeric: true });
}

export default function OrderTable({
  orders,
  marks = {},
  editable = false,
  selected,
  disabled = false,
  onToggle,
  onToggleAll,
  onStatusChange,
}: OrderTableProps): ReactElement {
  const strings = useAdminStrings();
  const [sort, setSort] = useState<Sort | null>(null);

  const rows = sort
    ? [...orders].sort((a, b) => {
        const result = compare(a, b, sort.key);
        return sort.direction === "ascending" ? result : -result;
      })
    : orders;

  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current?.key === key && current.direction === "ascending"
        ? { key, direction: "descending" }
        : { key, direction: "ascending" },
    );

  const columns: { key: SortKey; label: string; numeric?: boolean }[] = [
    { key: "orderId", label: strings.columnId.label },
    { key: "userId", label: strings.columnUser.label },
    { key: "date", label: strings.columnDate.label },
    { key: "amount", label: strings.columnAmount.label, numeric: true },
    { key: "status", label: strings.columnStatus.label },
  ];
  const allSelected = orders.length > 0 && orders.every((o) => selected?.has(o.orderId));

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          {editable ? (
            <th className="bg-background-1 border-line-2 w-13 border-b pl-4">
              <input
                type="checkbox"
                aria-label={strings.selectAll.label}
                checked={allSelected}
                disabled={disabled || orders.length === 0}
                onChange={() => onToggleAll?.()}
                className="size-4.5"
              />
            </th>
          ) : null}
          {columns.map((column) => {
            const active = sort?.key === column.key;
            const Icon = !active
              ? ArrowUpDown
              : sort.direction === "ascending"
                ? ArrowUp
                : ArrowDown;
            return (
              <th
                key={column.key}
                aria-sort={active ? sort.direction : "none"}
                className={cn(
                  "bg-background-1 border-line-2 text-muted-foreground-1 h-11 border-b px-4 text-left text-xs font-semibold tracking-wide whitespace-nowrap uppercase",
                  column.numeric && "text-right",
                  active && "text-foreground",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleSort(column.key)}
                  className="inline-flex items-center gap-1 uppercase"
                >
                  {column.label}
                  <Icon aria-hidden="true" className="size-3.5" />
                </button>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map((order) => {
          const marked = marks[order.orderId];
          const status = marked ?? order.status;
          const isSelected = selected?.has(order.orderId) ?? false;
          const badgeClass = cn(
            "inline-flex h-7.5 items-center gap-2 rounded-full px-3 text-xs font-semibold tracking-wide",
            status ? STATUS_CLASS[status] : OTHER_STATUS_CLASS,
          );
          return (
            <tr
              key={order.orderId}
              aria-label={`Order ${order.orderId}`}
              className={cn(isSelected && "bg-primary-50")}
            >
              {editable ? (
                <td className="border-line-1 h-13 border-b pl-4">
                  <input
                    type="checkbox"
                    aria-label={fill(strings.selectOrder.label, { id: order.orderId })}
                    checked={isSelected}
                    disabled={disabled}
                    onChange={() => onToggle?.(order.orderId)}
                    className="size-4.5"
                  />
                </td>
              ) : null}
              <td className="border-line-1 h-13 border-b px-4 font-mono text-[13px] font-medium">
                {order.orderId}
              </td>
              <td className="border-line-1 border-b px-4">{order.userId}</td>
              <td data-testid="date-cell" className="border-line-1 border-b px-4">
                {order.date}
              </td>
              <td
                data-testid="amount-cell"
                className="border-line-1 border-b px-4 text-right tabular-nums"
              >
                {formatAmount(order.amount)}
              </td>
              <td className="border-line-1 border-b px-4">
                <span className="relative inline-flex items-center">
                  <span data-testid="status-badge" className={badgeClass}>
                    {status ?? "—"}
                    {editable ? (
                      <ChevronDown aria-hidden="true" className="size-3.5 opacity-70" />
                    ) : null}
                  </span>
                  {editable ? (
                    <select
                      aria-label={fill(strings.statusOfOrder.label, { id: order.orderId })}
                      value={status ?? "PENDING"}
                      disabled={disabled}
                      onChange={(event) => {
                        const choice = event.target.value;
                        if (choice === "PENDING" || choice === "APPROVED" || choice === "DENIED") {
                          onStatusChange?.(order.orderId, choice);
                        }
                      }}
                      className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="DENIED">DENIED</option>
                    </select>
                  ) : null}
                </span>
                {marked ? (
                  <span className="text-muted-foreground-1 ml-2.5 text-xs">
                    {strings.notCommitted.label}
                  </span>
                ) : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
