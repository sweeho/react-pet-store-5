import { PawPrint } from "lucide-react";
import { useParams } from "react-router";

import { AsyncContent, ErrorState } from "@/components/state";
import { useLocale } from "@/i18n/LocaleProvider";
import { useScreen } from "@/i18n/screens";

import type { ItemView, ProductView } from "../../../lib/catalog/queries";
import { formatPrice } from "../../../lib/locale/money";

interface ProductPayload {
  product: ProductView;
  items: ItemView[];
}

async function loadProduct(productId: string, locale: string): Promise<ProductPayload | null> {
  const response = await fetch(
    `/api/catalog/products/${encodeURIComponent(productId)}?locale=${encodeURIComponent(locale)}`,
  );

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to load product ${productId}`);
  }

  return (await response.json()) as ProductPayload;
}

/**
 * Renders per-locale catalog content (D4, P4): the same route re-renders in
 * place when the session locale changes (SWHR-R-0008.01) because
 * `AsyncContent`'s `key` includes the locale, forcing a remount and a fresh
 * fetch — its own internal retry mechanism only reruns on `retryCount`, not
 * on prop changes. A product with no details in the requested locale is a
 * 404 from the API, surfaced here as "not found", never substituted with
 * another locale's content (SWHR-R-0014).
 */
export default function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const { locale } = useLocale();
  const t = useScreen("product");

  if (!productId) {
    return <ErrorState title={t.notFoundTitle} description={t.notFoundDescription} />;
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <AsyncContent
        key={`${productId}:${locale}`}
        load={() => loadProduct(productId, locale)}
        isEmpty={(data) => data === null}
        empty={<ErrorState title={t.notFoundTitle} description={t.notFoundDescription} />}
      >
        {(data) => {
          if (!data) {
            return null;
          }

          return (
            <>
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
                  <li
                    key={item.itemId}
                    className="border-line-2 bg-background flex items-center gap-4 rounded-xl border p-5"
                  >
                    <div className="bg-background-2 text-muted-foreground-2 flex size-24 shrink-0 items-center justify-center rounded-lg">
                      <PawPrint aria-hidden="true" className="size-8" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-muted-foreground-2 text-sm">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground-1 text-xs">{t.listPriceLabel}</p>
                      <p className="text-lg font-semibold">{formatPrice(item.listPrice, locale)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          );
        }}
      </AsyncContent>
    </div>
  );
}
