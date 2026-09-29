import { LogOut } from "lucide-react";
import { Link } from "react-router";

import { EmptyState } from "@/components/state";
import NotAuthorised from "@/components/supplier/NotAuthorised";
import { useSupplierLogout, useSupplierSession } from "@/components/supplier/useSupplierSession";
import { Button } from "@/components/ui/button";

interface StockRecord {
  itemId: string;
  quantity: number;
}

interface Entry {
  quantity: string;
  update: boolean;
}

/** SWHR-R-0231, SD-6: an empty list and a failed lookup both read as "no items". */
async function fetchStock(): Promise<StockRecord[]> {
  try {
    const response = await fetch("/api/supplier/inventory");
    if (!response.ok) return [];
    return ((await response.json()) as { items: StockRecord[] }).items;
  } catch {
    return [];
  }
}

/**
 * SWHR-R-0230: the inventory update screen (mockup-supplier-inventory.html, with
 * the spec's column labels and one Submit). Every row is posted with its Update
 * flag; the server applies only the ticked ones (SD-3).
 */
export default function SupplierInventoryUpdatePage() {
  const navigate = useNavigate();
  const session = useSupplierSession();
  const logout = useSupplierLogout();
  const [items, setItems] = useState<StockRecord[] | null>(null);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [failed, setFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const admin = session?.isAdministrator === true;

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    void fetchStock().then((result) => {
      if (!cancelled) setItems(result);
    });
    return () => {
      cancelled = true;
    };
  }, [admin]);

  if (!session) {
    return null;
  }

  if (!admin) {
    return <NotAuthorised />;
  }

  if (!items) {
    return null;
  }

  const entryOf = (itemId: string): Entry => entries[itemId] ?? { quantity: "", update: false };
  const setEntry = (itemId: string, patch: Partial<Entry>) =>
    setEntries((current) => ({ ...current, [itemId]: { ...entryOf(itemId), ...patch } }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFailed(false);
    try {
      const response = await fetch("/api/supplier/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: items.map(({ itemId }) => ({ itemId, ...entryOf(itemId) })),
        }),
      });
      if (response.ok) {
        navigate("/supplier/updated");
        return;
      }
      setFailed(true);
    } catch {
      setFailed(true);
    }
    setSubmitting(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-8 pt-6 pb-10">
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground-1 flex items-center gap-2 text-sm"
      >
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/supplier">Supplier</Link>
        <span>/</span>
        <b className="text-foreground font-medium">Inventory</b>
      </nav>
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] leading-tight font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground-1 max-w-155">
            Type the counted figure in <b>New Quantity</b> and tick <b>Update</b> on that row. Only
            ticked rows are saved, and the figure replaces the current quantity — it is not added to
            it.
          </p>
        </div>
        <Button variant="outline" onClick={() => void logout()}>
          <LogOut aria-hidden="true" className="mr-2 size-4" />
          Logout
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="There are no items in inventory." />
      ) : (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="bg-background border-line-2 overflow-hidden rounded-xl border"
        >
          <div className="border-line-2 border-b px-5 py-4 font-semibold">
            {items.length} stock records
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-muted-foreground-1 text-sm">
                <th className="w-[28%] px-5 py-3 font-medium">Item Id</th>
                <th className="w-[24%] px-5 py-3 text-right font-medium">Existing Quantity</th>
                <th className="w-[24%] px-5 py-3 text-right font-medium">New Quantity</th>
                <th className="py-3 pl-10 font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ itemId, quantity }) => {
                const entry = entryOf(itemId);
                return (
                  <tr
                    key={itemId}
                    className={
                      entry.update
                        ? "bg-primary-50 border-line-2 border-t"
                        : "border-line-2 border-t"
                    }
                  >
                    <td className="px-5 py-2.5 font-mono">{itemId}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{quantity}</td>
                    <td className="px-5 py-2.5 text-right">
                      <input
                        type="text"
                        inputMode="numeric"
                        aria-label={`New Quantity for ${itemId}`}
                        value={entry.quantity}
                        onChange={(event) => setEntry(itemId, { quantity: event.target.value })}
                        className="border-line-2 bg-background h-9 w-32 rounded-md border px-3 text-right"
                      />
                    </td>
                    <td className="py-2.5 pl-10">
                      <input
                        type="checkbox"
                        aria-label={`Update ${itemId}`}
                        checked={entry.update}
                        onChange={(event) => setEntry(itemId, { update: event.target.checked })}
                        className="size-4"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="bg-background-1 border-line-2 flex items-center justify-between gap-4 border-t px-5 py-4">
            <span className="text-muted-foreground-1">Rows without a tick are left unchanged.</span>
            {failed ? (
              <p role="alert" className="text-destructive text-sm">
                The inventory could not be updated. Check the quantities and try again.
              </p>
            ) : null}
            <Button type="submit" disabled={submitting}>
              Submit
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
