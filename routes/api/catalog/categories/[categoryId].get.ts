import { defineHandler, getRouterParam } from "nitro/h3";

import { getCategory, listProducts } from "../../../../lib/catalog/queries";
import {
  resolveLocale,
  resolvePaging,
  withCatalogErrorHandling,
} from "../../../../lib/catalog/request";

// Anonymous, read-only (SWHR-R-0097/0098). An unknown category answers 200
// with `category: null` and an empty page (SD6/SWHR-R-0089.02) — never a 404.
export default defineHandler((event) => {
  const categoryId = getRouterParam(event, "categoryId") as string;
  const locale = resolveLocale(event);
  const { start, count } = resolvePaging(event);

  return withCatalogErrorHandling(() => {
    const category = getCategory(categoryId, locale);
    const { items, paging } = listProducts(categoryId, locale, start, count);

    return { category, items, paging };
  });
});
