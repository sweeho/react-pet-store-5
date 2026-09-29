import { CircleCheck, CircleX, Info, LogOut, RefreshCw } from "lucide-react";
import type { ReactElement } from "react";
import { Link } from "react-router";

import ConfirmDialog from "@/components/admin/ConfirmDialog";
import FatalErrorDialog from "@/components/admin/FatalErrorDialog";
import {
  commitBatches,
  type Decision,
  fill,
  ORDER_STATUSES,
  type OrderStatus,
  type OrderSummary,
  parseOrderSummary,
} from "@/components/admin/orderData";
import OrderTable from "@/components/admin/OrderTable";
import SalesCharts, { DEFAULT_END_DATE, DEFAULT_START_DATE } from "@/components/admin/SalesCharts";
import { ErrorState } from "@/components/state";
import { Button } from "@/components/ui/button";
import { useAdminStrings } from "@/i18n/admin/useAdminStrings";
import { cn } from "@/utils";

interface StaffSessionResponse {
  signedOn: boolean;
  userId: string | null;
  isAdministrator: boolean;
}

interface ReportRange {
  start: string;
  end: string;
}

type ReportGroups = { name?: unknown; value?: unknown }[];
type Busy = "loading" | "updating" | null;

/** One request to the order-data service (design.md P6); any failure throws. */
async function postOrderData(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch("/api/admin/order-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const reply: unknown = await response.json().catch(() => ({}));
  const fields =
    typeof reply === "object" && reply !== null ? (reply as Record<string, unknown>) : {};
  if (!response.ok) {
    throw new Error(typeof fields.error === "string" ? fields.error : `HTTP ${response.status}`);
  }
  return fields;
}

async function getOrders(status: OrderStatus): Promise<OrderSummary[]> {
  const reply = await postOrderData({ type: "GETORDERS", status });
  const orders = Array.isArray(reply.orders) ? reply.orders : [];
  return orders.map((order) => parseOrderSummary(order as Record<string, unknown>));
}

async function getReport(type: "REVENUE" | "ORDERS", range: ReportRange): Promise<ReportGroups> {
  const reply = await postOrderData({ type, start: range.start, end: range.end });
  return Array.isArray(reply.groups) ? (reply.groups as ReportGroups) : [];
}

function byOrderId(a: OrderSummary, b: OrderSummary): number {
  return a.orderId.localeCompare(b.orderId, undefined, { numeric: true });
}

/**
 * SWHR-R-0186: the order-management workspace. Gated like the console
 * (SWHR-R-0075); every action goes through `POST /api/admin/order-data`, and a
 * failed request ends the session with a Fatal Error dialog (SWHR-R-0177, D6).
 */
export default function AdminOrdersPage(): ReactElement | null {
  const strings = useAdminStrings();
  const navigate = useNavigate();
  const [session, setSession] = useState<StaffSessionResponse | null>(null);
  const [view, setView] = useState<"orders" | "sales">("orders");
  const [subview, setSubview] = useState<"pending" | "nonPending">("pending");
  const [lists, setLists] = useState<Record<OrderStatus, OrderSummary[]>>({
    PENDING: [],
    APPROVED: [],
    DENIED: [],
    COMPLETED: [],
  });
  const [revenue, setRevenue] = useState<ReportGroups>([]);
  const [orderCounts, setOrderCounts] = useState<ReportGroups>([]);
  const [range, setRange] = useState<ReportRange>({
    start: DEFAULT_START_DATE,
    end: DEFAULT_END_DATE,
  });
  const [marks, setMarks] = useState<Record<string, Decision>>({});
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [busy, setBusy] = useState<Busy>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  /** Runs one server round trip: busy while it lasts, Fatal Error when it fails. */
  const run = async (kind: Exclude<Busy, null>, work: () => Promise<void>) => {
    setBusy(kind);
    try {
      await work();
    } catch (error) {
      setFatal(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  };

  const fetchOrders = async () => {
    const results = await Promise.all(ORDER_STATUSES.map((status) => getOrders(status)));
    setLists({
      PENDING: results[0],
      APPROVED: results[1],
      DENIED: results[2],
      COMPLETED: results[3],
    });
    setMarks({});
    setSelected(new Set());
  };

  const fetchReports = async (next: ReportRange) => {
    const [revenueGroups, countGroups] = await Promise.all([
      getReport("REVENUE", next),
      getReport("ORDERS", next),
    ]);
    setRevenue(revenueGroups);
    setOrderCounts(countGroups);
    setRange(next);
  };

  const loadAll = (next: ReportRange) =>
    run("loading", async () => {
      await Promise.all([fetchOrders(), fetchReports(next)]);
    });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/staff/session?realm=admin")
      .then((response) => response.json() as Promise<StaffSessionResponse>)
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (!result.signedOn) {
          navigate("/admin/signin", { replace: true });
          return;
        }
        setSession(result);
        if (result.isAdministrator) {
          void loadAll(range);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markedIds = Object.keys(marks);
  const locked = busy !== null || fatal !== null;

  const handleRefresh = () => {
    if (markedIds.length > 0) {
      setConfirmRefresh(true);
      return;
    }
    void loadAll(range);
  };

  const handleCommit = () => {
    const batches = commitBatches(marks);
    if (batches.length === 0) {
      return;
    }
    void run("updating", async () => {
      for (const batch of batches) {
        await postOrderData({
          type: "UPDATESTATUS",
          orders: batch.orderIds.map((orderId) => ({ orderId, status: batch.status })),
        });
      }
      await fetchOrders();
    });
  };

  const decide = (status: Decision) => {
    setMarks((current) => {
      const next = { ...current };
      for (const orderId of selected) {
        next[orderId] = status;
      }
      return next;
    });
  };

  const handleStatusChange = (orderId: string, status: "PENDING" | Decision) => {
    setMarks((current) => {
      const next = { ...current };
      if (status === "PENDING") {
        delete next[orderId];
      } else {
        next[orderId] = status;
      }
      return next;
    });
  };

  const toggle = (orderId: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(orderId)) {
        next.add(orderId);
      }
      return next;
    });

  const toggleAll = () =>
    setSelected((current) =>
      current.size === lists.PENDING.length
        ? new Set()
        : new Set(lists.PENDING.map((o) => o.orderId)),
    );

  const handleFatalSignOut = async () => {
    const result = await fetch("/api/staff/signoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ realm: "admin" }),
    })
      .then((response) => response.json() as Promise<{ redirect: string }>)
      .catch(() => ({ redirect: "/admin" }));
    navigate(result.redirect);
  };

  if (!session) {
    return null;
  }

  if (!session.isAdministrator) {
    return (
      <div className="p-8">
        <ErrorState
          title={strings.accessRefusedTitle.label}
          description={strings.accessRefusedDescription.label}
        />
      </div>
    );
  }

  const nonPending = [...lists.APPROVED, ...lists.DENIED, ...lists.COMPLETED].sort(byOrderId);
  const busyMessage =
    busy === "updating"
      ? strings.busyUpdating.label
      : busy === "loading"
        ? strings.busyLoading.label
        : "";

  const segmentClass = (active: boolean) =>
    cn(
      "inline-flex h-9 items-center gap-2 rounded-[7px] px-4 font-medium",
      active
        ? "bg-background text-foreground border-line-2 border shadow-xs"
        : "text-muted-foreground-2",
    );
  const tabClass = (active: boolean) =>
    cn(
      "-mb-px mr-6 inline-flex h-12 items-center gap-2 border-b-2 px-1 font-medium",
      active ? "text-primary border-primary" : "text-muted-foreground-1 border-transparent",
    );
  const countClass = (active: boolean) =>
    cn(
      "rounded-full px-2 py-px text-xs font-semibold",
      active ? "bg-primary-100 text-primary-700" : "bg-background-2 text-muted-foreground-2",
    );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-8 pt-6 pb-10">
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground-1 flex items-center gap-2 text-sm"
      >
        <Link to="/">{strings.crumbHome.label}</Link>
        <span>/</span>
        <Link to="/admin/console">{strings.crumbAdministration.label}</Link>
        <span>/</span>
        <b className="text-foreground font-medium">{strings.crumbOrders.label}</b>
      </nav>

      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-[28px] leading-tight font-bold tracking-tight">
            {strings.workspaceTitle.label}
          </h1>
          <p className="text-muted-foreground-1 mt-1">
            {strings.signedInAs.label}{" "}
            <b className="text-foreground font-semibold">{session.userId}</b>
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={locked} onClick={handleRefresh}>
            <RefreshCw aria-hidden="true" className="mr-2 size-4" />
            {strings.refreshButton.label}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={locked}
            onClick={() => setAboutOpen(true)}
          >
            <Info aria-hidden="true" className="mr-2 size-4" />
            {strings.aboutButton.label}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={locked}
            onClick={() => navigate("/admin/console")}
          >
            <LogOut aria-hidden="true" className="mr-2 size-4" />
            {strings.exitButton.label}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div role="tablist" className="bg-background-2 inline-flex gap-1 rounded-[10px] p-1">
          <button
            type="button"
            role="tab"
            aria-selected={view === "orders"}
            className={segmentClass(view === "orders")}
            onClick={() => setView("orders")}
          >
            {strings.ordersSegment.label}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "sales"}
            className={segmentClass(view === "sales")}
            onClick={() => setView("sales")}
          >
            {strings.salesSegment.label}
          </button>
        </div>
        <p role="status" aria-live="polite" className="text-muted-foreground-1 text-sm">
          {busyMessage}
        </p>
      </div>

      {view === "sales" ? (
        <SalesCharts
          revenue={revenue}
          orders={orderCounts}
          range={range}
          disabled={locked}
          onGetData={(start, end) => void run("loading", () => fetchReports({ start, end }))}
        />
      ) : (
        <section className="bg-background border-line-2 rounded-xl border">
          <div role="tablist" className="border-line-2 flex border-b px-5">
            <button
              type="button"
              role="tab"
              aria-selected={subview === "pending"}
              className={tabClass(subview === "pending")}
              onClick={() => setSubview("pending")}
            >
              {strings.pendingTab.label}{" "}
              <span className={countClass(subview === "pending")}>{lists.PENDING.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subview === "nonPending"}
              className={tabClass(subview === "nonPending")}
              onClick={() => setSubview("nonPending")}
            >
              {strings.nonPendingTab.label}{" "}
              <span className={countClass(subview === "nonPending")}>{nonPending.length}</span>
            </button>
          </div>

          {subview === "pending" ? (
            <>
              <div className="border-line-2 flex items-center justify-between border-b px-5 py-3">
                <div className="flex items-center gap-3">
                  <b className="font-semibold">
                    {fill(strings.selectedCount.label, { count: selected.size })}
                  </b>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={locked}
                    onClick={() => decide("APPROVED")}
                  >
                    <CircleCheck aria-hidden="true" className="mr-2 size-4 text-green-600" />
                    {strings.approveButton.label}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={locked}
                    onClick={() => decide("DENIED")}
                  >
                    <CircleX aria-hidden="true" className="text-destructive mr-2 size-4" />
                    {strings.denyButton.label}
                  </Button>
                </div>
                <div className="flex items-center gap-3.5">
                  <span className="text-muted-foreground-1 text-sm">
                    {fill(strings.decisionSummary.label, {
                      approve:
                        commitBatches(marks).find((b) => b.status === "APPROVED")?.orderIds
                          .length ?? 0,
                      deny:
                        commitBatches(marks).find((b) => b.status === "DENIED")?.orderIds.length ??
                        0,
                    })}
                  </span>
                  <Button type="button" disabled={locked} onClick={handleCommit}>
                    {strings.commitButton.label}
                  </Button>
                </div>
              </div>
              <OrderTable
                editable
                orders={lists.PENDING}
                marks={marks}
                selected={selected}
                disabled={locked}
                onToggle={toggle}
                onToggleAll={toggleAll}
                onStatusChange={handleStatusChange}
              />
              <div className="text-muted-foreground-1 bg-background-1 border-line-2 flex items-center justify-between rounded-b-xl border-t px-5 py-3.5 text-sm">
                <span>
                  {fill(strings.pendingFooter.label, {
                    count: lists.PENDING.length,
                    marked: markedIds.length,
                  })}
                </span>
                <span>{strings.pendingFootNote.label}</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-muted-foreground-1 border-line-2 flex items-center gap-2 border-b px-5 py-3">
                <Info aria-hidden="true" className="size-4" />
                {strings.nonPendingReadOnly.label}
              </div>
              <OrderTable orders={nonPending} />
              <div className="text-muted-foreground-1 bg-background-1 border-line-2 rounded-b-xl border-t px-5 py-3.5 text-sm">
                {fill(strings.nonPendingFooter.label, { count: nonPending.length })}
              </div>
            </>
          )}
        </section>
      )}

      <ConfirmDialog
        open={confirmRefresh}
        title={strings.refreshWarningTitle.label}
        text={strings.refreshWarningText.label}
        note={fill(strings.refreshWarningNote.label, {
          count: markedIds.length,
          ids: markedIds.join(", "),
        })}
        cancelLabel={strings.cancelButton.label}
        confirmLabel={strings.discardRefreshButton.label}
        onCancel={() => setConfirmRefresh(false)}
        onConfirm={() => {
          setConfirmRefresh(false);
          void loadAll(range);
        }}
      />
      <ConfirmDialog
        open={aboutOpen}
        title={strings.aboutTitle.label}
        text={strings.aboutText.label}
        confirmLabel={strings.closeButton.label}
        onConfirm={() => setAboutOpen(false)}
      />
      <FatalErrorDialog
        open={fatal !== null}
        title={strings.fatalTitle.label}
        message={fatal ?? ""}
        actionLabel={strings.fatalSignOutButton.label}
        onAction={() => void handleFatalSignOut()}
      />
    </div>
  );
}
