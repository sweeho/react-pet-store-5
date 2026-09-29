import { Link, useParams, useSearchParams } from "react-router";

import AddToCartButton from "@/components/catalog/AddToCartButton";
import Breadcrumb from "@/components/catalog/Breadcrumb";
import PagingLinks from "@/components/catalog/PagingLinks";
import PetsMenu from "@/components/layout/PetsMenu";
import { AsyncContent, ErrorState } from "@/components/state";
import { useLocale } from "@/i18n/LocaleProvider";
import { useScreen } from "@/i18n/screens";

import { DEFAULT_PAGE_SIZE, type PageInfo } from "../../../lib/catalog/paging";
import type { ItemView, ProductView } from "../../../lib/catalog/queries";
import { formatPrice } from "../../../lib/locale/money";

interface ProductPayload {
  product: ProductView;
  items: ItemView[];
  paging: PageInfo;
}

function parseIntParam(value: string | null, fallback: number): number {
  if (value === null) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

async function loadProduct(
  productId: string,
  locale: string,
  start: number,
  count: number,
): Promise<ProductPayload | null> {
  const params = new URLSearchParams({ locale, start: String(start), count: String(count) });
  const response = await fetch(
    `/api/catalog/products/${encodeURIComponent(productId)}?${params.toString()}`,
  );

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to load product ${productId}`);
  }

  return (await response.json()) as ProductPayload;
}

interface ItemRowProps {
  item: ItemView;
  locale: string;
  labels: { listPriceLabel: string; addToCart: string; addedToCart: string };
}

// Cart seam (design.md P9): an Add to Cart control per item. Never gated —
// POST /api/cart/items requires no sign-on (SWHR-R-0070).
function ItemRow({ item, locale, labels }: ItemRowProps) {
  return (
    <li className="border-line-2 bg-background flex items-center gap-4 rounded-xl border p-5">
      <div className="bg-background-2 text-muted-foreground-2 flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg">
        <img src={`/images/${item.image}`} alt="" className="size-full object-cover" />
      </div>
      <div className="flex-1">
        <Link to={`/item/${item.itemId}`} className="font-semibold hover:underline">
          {item.name}
        </Link>
        <p className="text-muted-foreground-2 text-sm">{item.description}</p>
      </div>
      <div className="text-right">
        <p className="text-muted-foreground-1 text-xs">{labels.listPriceLabel}</p>
        <p className="text-lg font-semibold">{formatPrice(item.listPrice, locale)}</p>
      </div>
      <AddToCartButton
        itemId={item.itemId}
        label={labels.addToCart}
        addedLabel={labels.addedToCart}
      />
    </li>
  );
}

/**
 * Renders per-locale catalog content (D4, P4): the same route re-renders in
 * place when the session locale or paging params change (SWHR-R-0008.01)
 * because `AsyncContent`'s `key` includes them, forcing a remount and a
 * fresh fetch. A product with no details in the requested locale is a 404
 * from the API, surfaced here as "not found", never substituted with
 * another locale's content (SWHR-R-0014).
 */
export default function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const { locale } = useLocale();
  const t = useScreen("product");
  const shell = useScreen("shell");

  if (!productId) {
    return <ErrorState title={t.notFoundTitle} description={t.notFoundDescription} />;
  }

  const start = parseIntParam(searchParams.get("start"), 0);
  const count = parseIntParam(searchParams.get("count"), DEFAULT_PAGE_SIZE);

  return (
    <div className="flex gap-8">
      <PetsMenu />
      <div className="min-w-0 flex-1">
        <AsyncContent
          key={`${productId}:${locale}:${start}:${count}`}
          load={() => loadProduct(productId, locale, start, count)}
          isEmpty={(data) => data === null}
          empty={<ErrorState title={t.notFoundTitle} description={t.notFoundDescription} />}
        >
          {(data) => {
            if (!data) {
              return null;
            }

            return (
              <div className="flex flex-col gap-6">
                <Breadcrumb
                  items={[
                    { label: shell.breadcrumbHome, to: "/" },
                    { label: data.product.categoryId, to: `/category/${data.product.categoryId}` },
                    { label: data.product.name },
                  ]}
                />
                <div>
                  <h1 className="text-2xl font-bold">{data.product.name}</h1>
                  {data.product.description ? (
                    <p className="text-muted-foreground-2 mt-1 max-w-2xl">
                      {data.product.description}
                    </p>
                  ) : null}
                </div>
                <ul className="flex flex-col gap-4">
                  {data.items.map((item) => (
                    <ItemRow
                      key={item.itemId}
                      item={item}
                      locale={locale}
                      labels={{
                        listPriceLabel: t.listPriceLabel,
                        addToCart: t.addToCart,
                        addedToCart: t.addedToCart,
                      }}
                    />
                  ))}
                </ul>
                <PagingLinks
                  paging={data.paging}
                  makeHref={(newStart) => `/product/${productId}?start=${newStart}&count=${count}`}
                />
              </div>
            );
          }}
        </AsyncContent>
      </div>
    </div>
  );
}
