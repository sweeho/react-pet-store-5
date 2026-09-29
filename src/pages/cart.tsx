import { PawPrint } from "lucide-react";

import PetTipsBanner from "@/components/account/PetTipsBanner";
import { AsyncContent, EmptyState } from "@/components/state";
import { useScreen } from "@/i18n/screens";

import type { CartLine, CartView } from "../../lib/cart/types";
import { formatPrice } from "../../lib/locale/money";

async function loadCart(): Promise<CartView> {
  const response = await fetch("/api/cart");
  if (!response.ok) {
    throw new Error("Failed to load cart");
  }
  return (await response.json()) as CartView;
}

/**
 * The cart seam (design.md P9): lists the anonymous or signed-on session's
 * lines with item details, through GET /api/cart. Remove, update and
 * subtotal are shopping-cart's (swhr-i-0008) — this ticket only lists
 * quantities.
 */
export default function CartPage() {
  const t = useScreen("cart");

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <PetTipsBanner />
      <AsyncContent
        load={loadCart}
        isEmpty={(view) => view.count === 0}
        empty={<EmptyState title={t.emptyTitle} description={t.emptyDescription} />}
      >
        {(view) => (
          <ul className="flex flex-col gap-4">
            {view.lines.map((line: CartLine) => (
              <li
                key={line.itemId}
                className="border-line-2 bg-background flex items-center gap-4 rounded-xl border p-5"
              >
                <div className="bg-background-2 text-muted-foreground-2 flex size-24 shrink-0 items-center justify-center rounded-lg">
                  <PawPrint aria-hidden="true" className="size-8" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{line.name}</p>
                  <p className="text-muted-foreground-2 text-sm">
                    {t.quantityLabel}: {line.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{formatPrice(line.unitCost, view.locale)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AsyncContent>
    </div>
  );
}
