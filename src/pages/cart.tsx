import { PawPrint } from "lucide-react";

import PetTipsBanner from "@/components/account/PetTipsBanner";
import { AsyncContent, EmptyState } from "@/components/state";
import { useLocale } from "@/i18n/LocaleProvider";
import { useScreen } from "@/i18n/screens";

import type { ItemView } from "../../lib/catalog/queries";
import { formatPrice } from "../../lib/locale/money";

interface CartLine {
  itemId: string;
  quantity: number;
  item: ItemView;
}

async function loadCart(): Promise<CartLine[]> {
  const response = await fetch("/api/cart");
  if (!response.ok) {
    throw new Error("Failed to load cart");
  }
  const data = (await response.json()) as { lines: CartLine[] };
  return data.lines;
}

/**
 * The cart seam (design.md P9): lists the anonymous or signed-on session's
 * lines with item details, through GET /api/cart. Remove, update and
 * subtotal are shopping-cart's (swhr-i-0008) — this ticket only lists
 * quantities.
 */
export default function CartPage() {
  const { locale } = useLocale();
  const t = useScreen("cart");

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <PetTipsBanner />
      <AsyncContent
        load={loadCart}
        isEmpty={(lines) => lines.length === 0}
        empty={<EmptyState title={t.emptyTitle} description={t.emptyDescription} />}
      >
        {(lines) => (
          <ul className="flex flex-col gap-4">
            {lines.map((line) => (
              <li
                key={line.itemId}
                className="border-line-2 bg-background flex items-center gap-4 rounded-xl border p-5"
              >
                <div className="bg-background-2 text-muted-foreground-2 flex size-24 shrink-0 items-center justify-center rounded-lg">
                  <PawPrint aria-hidden="true" className="size-8" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{line.item.name}</p>
                  <p className="text-muted-foreground-2 text-sm">
                    {t.quantityLabel}: {line.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    {formatPrice(line.item.listPrice, locale)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AsyncContent>
    </div>
  );
}
