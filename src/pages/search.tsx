import { Link, useSearchParams } from "react-router";

import AddToCartButton from "@/components/catalog/AddToCartButton";
import Breadcrumb from "@/components/catalog/Breadcrumb";
import PagingLinks from "@/components/catalog/PagingLinks";
import PetsMenu from "@/components/layout/PetsMenu";
import { AsyncContent, EmptyState } from "@/components/state";
import { useLocale } from "@/i18n/LocaleProvider";
import { useScreen } from "@/i18n/screens";

import { DEFAULT_PAGE_SIZE, type PageInfo } from "../../lib/catalog/paging";
import type { ItemView } from "../../lib/catalog/queries";
import { formatPrice } from "../../lib/locale/money";

interface SearchPayload {
  keywords: string[];
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

async function loadSearch(
  keywords: string,
  locale: string,
  start: number,
  count: number,
): Promise<SearchPayload> {
  const params = new URLSearchParams({
    keywords,
    locale,
    start: String(start),
    count: String(count),
  });
  const response = await fetch(`/api/catalog/search?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to load search results");
  }

  return (await response.json()) as SearchPayload;
}

/**
 * Replaces the "coming soon" placeholder (design.md SWHR-T-0060). Rows
 * show the unit cost (Q7 — search is the one listing that shows unit cost,
 * not list price). A blank keyword field and "nothing matches" render the
 * same no-results frame (SWHR-R-0107) — the API already answers both with
 * an empty `items` array.
 */
export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const { locale } = useLocale();
  const t = useScreen("search");
  const shell = useScreen("shell");

  const keywordsParam = searchParams.get("keywords") ?? "";
  const start = parseIntParam(searchParams.get("start"), 0);
  const count = parseIntParam(searchParams.get("count"), DEFAULT_PAGE_SIZE);

  return (
    <div className="flex gap-8">
      <PetsMenu />
      <div className="min-w-0 flex-1">
        <AsyncContent
          key={`${keywordsParam}:${locale}:${start}:${count}`}
          load={() => loadSearch(keywordsParam, locale, start, count)}
          empty={null}
        >
          {(data) => (
            <div className="flex flex-col gap-6">
              <Breadcrumb items={[{ label: shell.breadcrumbHome, to: "/" }, { label: t.title }]} />
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">{t.title}</h1>
                {data.keywords.length > 0 ? (
                  <div
                    data-testid="search-keywords"
                    className="text-muted-foreground-2 flex flex-wrap items-center gap-2"
                  >
                    <span>{t.matchingKeywordsPrefix}&nbsp;</span>
                    <span className="bg-background-2 text-foreground rounded-full px-3 py-1 text-sm font-medium">
                      {data.keywords.join(" ")}
                    </span>
                  </div>
                ) : null}
              </div>
              {data.items.length === 0 ? (
                <EmptyState title={t.noResultsTitle} description={t.noResultsDescription} />
              ) : (
                <>
                  <ul className="flex flex-col gap-4">
                    {data.items.map((item) => (
                      <li
                        key={item.itemId}
                        className="border-line-2 bg-background flex items-center gap-4 rounded-xl border p-5"
                      >
                        <div className="bg-background-2 flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                          <img
                            src={`/images/${item.image}`}
                            alt=""
                            className="size-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <Link
                            to={`/item/${item.itemId}`}
                            className="font-semibold hover:underline"
                          >
                            {item.name}
                          </Link>
                          <p className="text-muted-foreground-2 text-sm">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground-1 text-xs">{t.yourPriceLabel}</p>
                          <p className="text-lg font-semibold">
                            {formatPrice(item.unitCost, locale)}
                          </p>
                        </div>
                        <AddToCartButton
                          itemId={item.itemId}
                          label={t.addToCart}
                          addedLabel={t.addedToCart}
                        />
                      </li>
                    ))}
                  </ul>
                  <PagingLinks
                    paging={data.paging}
                    makeHref={(newStart) =>
                      `/search?keywords=${encodeURIComponent(keywordsParam)}&start=${newStart}&count=${count}`
                    }
                  />
                </>
              )}
            </div>
          )}
        </AsyncContent>
      </div>
    </div>
  );
}
