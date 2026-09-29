import { Link, useParams, useSearchParams } from "react-router";

import Breadcrumb from "@/components/catalog/Breadcrumb";
import PagingLinks from "@/components/catalog/PagingLinks";
import PetsMenu from "@/components/layout/PetsMenu";
import { AsyncContent, EmptyState, ErrorState } from "@/components/state";
import { useLocale } from "@/i18n/LocaleProvider";
import { useScreen } from "@/i18n/screens";

import { DEFAULT_PAGE_SIZE, type PageInfo } from "../../../lib/catalog/paging";
import type { CategoryView, ProductView } from "../../../lib/catalog/queries";

interface CategoryPayload {
  category: CategoryView | null;
  items: ProductView[];
  paging: PageInfo;
}

function parseIntParam(value: string | null, fallback: number): number {
  if (value === null) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

async function loadCategory(
  categoryId: string,
  locale: string,
  start: number,
  count: number,
): Promise<CategoryPayload> {
  const params = new URLSearchParams({ locale, start: String(start), count: String(count) });
  const response = await fetch(
    `/api/catalog/categories/${encodeURIComponent(categoryId)}?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to load category ${categoryId}`);
  }

  return (await response.json()) as CategoryPayload;
}

/**
 * Replaces the "coming soon" placeholder (design.md SWHR-T-0060). Products
 * A–Z, paged two at a time (P1, Q4); an unknown category answers 200 with
 * an empty page rather than an error (SD6), rendered the same as a
 * category with no products in this locale.
 */
export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const { locale } = useLocale();
  const t = useScreen("category");
  const shell = useScreen("shell");

  if (!categoryId) {
    return <ErrorState title={t.fallbackTitle} />;
  }

  const start = parseIntParam(searchParams.get("start"), 0);
  const count = parseIntParam(searchParams.get("count"), DEFAULT_PAGE_SIZE);

  return (
    <div className="flex gap-8">
      <PetsMenu activeCategoryId={categoryId} />
      <div className="min-w-0 flex-1">
        <AsyncContent
          key={`${categoryId}:${locale}:${start}:${count}`}
          load={() => loadCategory(categoryId, locale, start, count)}
          empty={null}
        >
          {(data) => {
            const title = data.category?.name ?? categoryId;

            return (
              <div className="flex flex-col gap-6">
                <Breadcrumb items={[{ label: shell.breadcrumbHome, to: "/" }, { label: title }]} />
                <h1 className="text-2xl font-bold">{title}</h1>
                {data.items.length === 0 ? (
                  <EmptyState
                    title={t.emptyTitle}
                    description={t.emptyDescription}
                    action={
                      <Link
                        to="/"
                        className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold"
                      >
                        {t.backToHome}
                      </Link>
                    }
                  />
                ) : (
                  <>
                    <ul className="flex flex-col gap-4">
                      {data.items.map((product) => (
                        <li
                          key={product.productId}
                          className="border-line-2 bg-background flex flex-col gap-1 rounded-xl border p-5"
                        >
                          <Link
                            to={`/product/${product.productId}`}
                            className="font-semibold hover:underline"
                          >
                            {product.name}
                          </Link>
                          {product.description ? (
                            <p className="text-muted-foreground-2 text-sm">{product.description}</p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                    <PagingLinks
                      paging={data.paging}
                      makeHref={(newStart) =>
                        `/category/${categoryId}?start=${newStart}&count=${count}`
                      }
                    />
                  </>
                )}
              </div>
            );
          }}
        </AsyncContent>
      </div>
    </div>
  );
}
