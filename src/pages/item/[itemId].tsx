import { useParams } from "react-router";

import AddToCartButton from "@/components/catalog/AddToCartButton";
import Breadcrumb from "@/components/catalog/Breadcrumb";
import PetsMenu from "@/components/layout/PetsMenu";
import { AsyncContent, ErrorState } from "@/components/state";
import { useLocale } from "@/i18n/LocaleProvider";
import { useScreen } from "@/i18n/screens";

import type { ItemView } from "../../../lib/catalog/queries";
import { formatPrice } from "../../../lib/locale/money";

interface ItemPayload {
  item: ItemView;
}

async function loadItem(itemId: string, locale: string): Promise<ItemPayload | null> {
  const response = await fetch(
    `/api/catalog/items/${encodeURIComponent(itemId)}?locale=${encodeURIComponent(locale)}`,
  );

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to load item ${itemId}`);
  }

  return (await response.json()) as ItemPayload;
}

/**
 * New page (design.md SWHR-T-0060, SWHR-R-0103): title reads the item's
 * display name (attribute + product name, e.g. "Male Adult Bulldog"), the
 * image comes from /images/<image> (SD10), and both List Price and Your
 * Price are shown (Q7 — the item detail page is the one screen that shows
 * both prices).
 */
export default function ItemPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const { locale } = useLocale();
  const t = useScreen("item");
  const shell = useScreen("shell");

  if (!itemId) {
    return <ErrorState title={t.notFoundTitle} description={t.notFoundDescription} />;
  }

  return (
    <div className="flex gap-8">
      <PetsMenu />
      <div className="min-w-0 flex-1">
        <AsyncContent
          key={`${itemId}:${locale}`}
          load={() => loadItem(itemId, locale)}
          isEmpty={(data) => data === null}
          empty={<ErrorState title={t.notFoundTitle} description={t.notFoundDescription} />}
        >
          {(data) => {
            if (!data) {
              return null;
            }
            const { item } = data;

            return (
              <div className="flex flex-col gap-6 sm:flex-row">
                <div className="bg-background-2 flex size-full max-w-sm shrink-0 items-center justify-center overflow-hidden rounded-xl sm:size-72">
                  <img
                    src={`/images/${item.image}`}
                    alt={item.name}
                    className="size-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-4.5">
                  <Breadcrumb
                    items={[
                      { label: shell.breadcrumbHome, to: "/" },
                      { label: item.categoryId, to: `/category/${item.categoryId}` },
                      { label: item.productName, to: `/product/${item.productId}` },
                      { label: item.name },
                    ]}
                  />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-muted-foreground-1 font-mono text-xs">{item.itemId}</span>
                    <h1 className="text-2xl font-bold">{item.name}</h1>
                    <p className="text-muted-foreground-2">{item.description}</p>
                  </div>
                  <dl className="border-line-2 grid grid-cols-[140px_1fr] gap-y-3 border-y py-5">
                    <dt className="text-muted-foreground-2">{t.listPriceLabel}</dt>
                    <dd className="text-xl font-bold">{formatPrice(item.listPrice, locale)}</dd>
                    <dt className="text-muted-foreground-2">{t.yourPriceLabel}</dt>
                    <dd className="text-base font-semibold">
                      {formatPrice(item.unitCost, locale)}
                    </dd>
                  </dl>
                  <div>
                    <AddToCartButton
                      itemId={item.itemId}
                      label={t.addToCart}
                      addedLabel={t.addedToCart}
                      size="default"
                    />
                  </div>
                </div>
              </div>
            );
          }}
        </AsyncContent>
      </div>
    </div>
  );
}
