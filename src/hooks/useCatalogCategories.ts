import { useLocale } from "@/i18n/LocaleProvider";

import type { CategoryView } from "../../lib/catalog/queries";

export type CatalogCategoriesState =
  | { status: "loading"; categories: CategoryView[] }
  | { status: "success"; categories: CategoryView[] }
  | { status: "error"; categories: CategoryView[] };

async function defaultFetchCategories(locale: string): Promise<CategoryView[]> {
  const response = await fetch(`/api/catalog/categories?locale=${encodeURIComponent(locale)}`);
  if (!response.ok) {
    throw new Error("Failed to load catalog categories");
  }
  const data = (await response.json()) as { categories: CategoryView[] };
  return data.categories;
}

/**
 * The Pets menu / picture map seam (design.md P5): GET /api/catalog/categories
 * for the session locale, refetching whenever it changes. Mirrors
 * useSignOnSession's inject-then-ref pattern so no consumer needs a real
 * network round trip in tests, and so a caller-supplied `fetchCategories`
 * doesn't retrigger the effect on every render.
 */
export function useCatalogCategories(
  fetchCategories: (locale: string) => Promise<CategoryView[]> = defaultFetchCategories,
): CatalogCategoriesState {
  const { locale } = useLocale();
  const [state, setState] = useState<CatalogCategoriesState>({
    status: "loading",
    categories: [],
  });
  const fetchRef = useRef(fetchCategories);

  useEffect(() => {
    fetchRef.current = fetchCategories;
  });

  useEffect(() => {
    let cancelled = false;

    fetchRef.current(locale).then(
      (categories) => {
        if (!cancelled) {
          setState({ status: "success", categories });
        }
      },
      () => {
        if (!cancelled) {
          setState({ status: "error", categories: [] });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [locale]);

  return state;
}
