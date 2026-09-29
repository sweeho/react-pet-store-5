import type { CategoryView } from "../../lib/catalog/queries";

export type CatalogCategoriesState =
  | { status: "loading"; categories: CategoryView[] }
  | { status: "success"; categories: CategoryView[] }
  | { status: "error"; categories: CategoryView[] };

export function useCatalogCategories(
  fetchCategories?: (locale: string) => Promise<CategoryView[]>,
): CatalogCategoriesState {
  void fetchCategories;
  throw new Error("VortexNotImplemented");
}
