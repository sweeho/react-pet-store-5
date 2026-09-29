import { createElement } from "react";
import { Link } from "react-router";

import { getCategoryIcon } from "@/components/catalog/categoryIcons";
import { useAccount } from "@/hooks";
import { useLocale } from "@/i18n/LocaleProvider";
import { useScreen } from "@/i18n/screens";

import type { ProductView } from "../../../lib/catalog/queries";

const MY_LIST_SIZE = 10;

interface MyList {
  categoryId: string;
  categoryName: string;
  products: ProductView[];
}

async function loadMyList(categoryId: string): Promise<MyList> {
  const response = await fetch(
    `/api/catalog/categories/${encodeURIComponent(categoryId)}?start=0&count=${MY_LIST_SIZE}`,
  );
  if (!response.ok) throw new Error("Failed to load My List");
  const data = (await response.json()) as {
    category?: { name: string } | null;
    items?: ProductView[];
  };
  return { categoryId, categoryName: data.category?.name ?? "", products: data.items ?? [] };
}

function CategoryIcon({ categoryId }: { categoryId: string }) {
  return createElement(getCategoryIcon(categoryId), {
    "aria-hidden": true,
    className: "text-muted-foreground-1 size-4.5",
  });
}

/**
 * The My List panel (design.md P10): up to 10 products of the customer's
 * favourite category, under the Pets menu. Absent for an anonymous visitor,
 * with My List off, or with no favourite category.
 */
export default function MyListPanel() {
  const { account } = useAccount();
  const { locale } = useLocale();
  const t = useScreen("pet-tips");
  const [list, setList] = useState<MyList | null>(null);
  const profile = account?.profile;
  const categoryId = profile?.myListPreference ? profile.favoriteCategory : null;

  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;
    loadMyList(categoryId).then(
      (loaded) => {
        if (!cancelled) setList(loaded);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [categoryId, locale]);

  // A list loaded for a previous favourite category is never shown for a new one.
  if (!categoryId || list?.categoryId !== categoryId) return null;

  return (
    <nav
      aria-label={`${t.myListHeading} · ${list.categoryName}`}
      className="border-line-2 bg-background mt-4 rounded-xl border p-2"
    >
      <h3 className="text-muted-foreground-1 px-2.5 pt-2 pb-1.5 text-xs font-semibold tracking-wide uppercase">
        {t.myListHeading} · {list.categoryName}
      </h3>
      {list.products.map((product) => (
        <Link
          key={product.productId}
          to={`/product/${product.productId}`}
          className="text-foreground hover:bg-background-1 flex h-10 items-center gap-3 rounded-md px-2.5 font-medium"
        >
          <CategoryIcon categoryId={categoryId} />
          {product.name}
        </Link>
      ))}
    </nav>
  );
}
