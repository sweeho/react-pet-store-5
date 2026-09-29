import { ArrowRight, Info, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "react-router";

import PetTipsBanner from "@/components/account/PetTipsBanner";
import { AsyncContent } from "@/components/state";
import { Button } from "@/components/ui/button";
import { useScreen } from "@/i18n/screens";

import type { CartLine, CartView } from "../../lib/cart/types";
import { formatPrice } from "../../lib/locale/money";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

async function readCart(response: Response): Promise<CartView> {
  if (!response.ok) {
    throw new Error("Cart request failed");
  }
  return (await response.json()) as CartView;
}

function loadCart(): Promise<CartView> {
  return fetch("/api/cart").then(readCart);
}

function notifyCartChanged(): void {
  window.dispatchEvent(new Event("cart:changed"));
}

function categoryLabel(categoryId: string): string {
  return categoryId.charAt(0) + categoryId.slice(1).toLowerCase();
}

function quantityInputs(view: CartView): Record<string, string> {
  return Object.fromEntries(view.lines.map((line) => [line.itemId, String(line.quantity)]));
}

function CartScreen({ initial }: { initial: CartView }) {
  const t = useScreen("cart");
  const [view, setView] = useState(initial);
  const [inputs, setInputs] = useState(() => quantityInputs(initial));

  // Every change answers the full CartView (P7), so the screen re-renders from it.
  const apply = async (request: Promise<Response>) => {
    try {
      const next = await readCart(await request);
      setView(next);
      setInputs(quantityInputs(next));
      notifyCartChanged();
    } catch {
      // A failed request leaves the screen as it was; the shopper can retry.
    }
  };

  const handleRemove = (itemId: string) =>
    apply(fetch(`/api/cart/items/${encodeURIComponent(itemId)}`, { method: "DELETE" }));

  const handleUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    return apply(
      fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantities: inputs }),
      }),
    );
  };

  if (view.count === 0) {
    return (
      <section className="border-line-2 bg-background flex flex-col items-center gap-3 rounded-xl border px-8 py-18 text-center">
        <div className="bg-background-2 text-muted-foreground-2 mb-2 flex size-14 items-center justify-center rounded-full">
          <ShoppingCart aria-hidden="true" className="size-6.5" />
        </div>
        <p className="text-lg font-medium">{t.emptyMessage}</p>
        <Link
          to="/"
          className={`text-primary inline-flex min-h-11 items-center font-semibold hover:underline ${FOCUS_RING}`}
        >
          {t.backToHome}
        </Link>
      </section>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleUpdate(event)}
      className="border-line-2 bg-background overflow-hidden rounded-xl border"
    >
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-background-1 border-line-2 text-muted-foreground-1 border-b text-left text-xs font-semibold tracking-wider uppercase">
            <th className="px-6 py-3">{t.itemColumn}</th>
            <th className="w-36 px-6 py-3">
              <span className="sr-only">{t.removeColumn}</span>
            </th>
            <th className="w-40 px-6 py-3 text-right">{t.quantityColumn}</th>
            <th className="w-40 px-6 py-3 text-right">{t.unitPriceColumn}</th>
          </tr>
        </thead>
        <tbody>
          {view.lines.map((line: CartLine) => {
            const title = [line.attribute, line.productName].filter(Boolean).join(" ");
            return (
              <tr key={line.itemId} className="border-line-2 border-b align-middle">
                <td className="px-6 py-4.5">
                  <Link
                    to={`/item/${line.itemId}`}
                    className={`text-primary text-[15px] font-semibold hover:underline ${FOCUS_RING}`}
                  >
                    {title}
                  </Link>
                  <div className="text-muted-foreground-1 mt-0.5 text-[13px] tabular-nums">
                    {line.itemId} · {categoryLabel(line.categoryId)}
                  </div>
                </td>
                <td className="px-6 py-4.5">
                  <button
                    type="button"
                    aria-label={`${t.remove} ${title}`}
                    onClick={() => void handleRemove(line.itemId)}
                    className={`text-destructive inline-flex h-11 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium hover:underline ${FOCUS_RING}`}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    {t.remove}
                  </button>
                </td>
                <td className="px-6 py-4.5 text-right">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={inputs[line.itemId] ?? ""}
                    aria-label={`${t.quantityFor} ${title}`}
                    onChange={(event) =>
                      setInputs((current) => ({ ...current, [line.itemId]: event.target.value }))
                    }
                    className={`border-line-3 bg-background h-11 w-22 rounded-md border px-3 text-right text-[15px] font-medium tabular-nums ${FOCUS_RING}`}
                  />
                </td>
                <td className="px-6 py-4.5 text-right text-[15px] font-medium tabular-nums">
                  {formatPrice(line.unitCost, view.locale)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center justify-between gap-6 px-6 py-5">
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" variant="outline" className="h-11">
            {t.updateCart}
          </Button>
          <span className="text-muted-foreground-1 flex items-center gap-2 text-[13px]">
            <Info aria-hidden="true" className="size-4 shrink-0" />
            {t.updateHint}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="bg-primary-50 border-primary-100 flex flex-col items-end rounded-lg border px-5 py-2">
            <span className="text-primary-700 text-xs font-semibold tracking-wider uppercase">
              {t.subtotal}
            </span>
            <b className="text-2xl font-bold tabular-nums">
              {formatPrice(view.subtotal, view.locale)}
            </b>
          </div>
          <Link
            to="/checkout"
            className={`bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-12 items-center gap-2 rounded-md px-6 text-sm font-semibold whitespace-nowrap ${FOCUS_RING}`}
          >
            {t.checkOut}
            <ArrowRight aria-hidden="true" className="size-4.5" />
          </Link>
        </div>
      </div>
    </form>
  );
}

/**
 * The cart screen (design.md P8): GET /api/cart on load; Remove (DELETE)
 * and Update Cart (one PATCH with every raw quantity) answer the full
 * CartView, which the screen re-renders from.
 */
export default function CartPage() {
  const t = useScreen("cart");

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <PetTipsBanner />
      <AsyncContent load={loadCart} empty={null}>
        {(view) => <CartScreen initial={view} />}
      </AsyncContent>
    </div>
  );
}
