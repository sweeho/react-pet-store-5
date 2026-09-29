import { Link } from "react-router";

import { getCategoryIcon } from "@/components/catalog/categoryIcons";
import { useCatalogCategories } from "@/hooks";
import { useScreen } from "@/i18n/screens";
import { cn } from "@/utils";

export interface PetsMenuProps {
  activeCategoryId?: string;
}

/**
 * The side "Pets" panel every mockup shows left of `main` from `lg` up
 * (design.md, SWHR-R-0104): the categories GET /api/catalog/categories
 * returns for the session locale, ordered as returned — never the static
 * PET_CATEGORIES labels (SD7).
 */
export default function PetsMenu({ activeCategoryId }: PetsMenuProps) {
  const { categories } = useCatalogCategories();
  const t = useScreen("shell");

  return (
    <aside className="hidden w-58 shrink-0 lg:block">
      <nav
        aria-label="Pets"
        className="border-line-2 bg-background sticky top-4 rounded-xl border p-2"
      >
        <h3 className="text-muted-foreground-1 px-2.5 pt-2 pb-1.5 text-xs font-semibold tracking-wide uppercase">
          {t.petsMenuHeading}
        </h3>
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.categoryId);
          const active = category.categoryId === activeCategoryId;

          return (
            <Link
              key={category.categoryId}
              to={`/category/${category.categoryId}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-2.5 font-medium",
                active ? "bg-primary-50 text-primary-700" : "text-foreground hover:bg-background-1",
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn("size-4.5", active ? "text-primary" : "text-muted-foreground-1")}
              />
              {category.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
