import { defineHandler, getQuery } from "nitro/h3";

import { searchItems } from "../../../lib/catalog/queries";
import {
  resolveLocale,
  resolvePaging,
  withCatalogErrorHandling,
} from "../../../lib/catalog/request";

// Anonymous, read-only (SWHR-R-0097/0098). A blank/missing `?keywords=`
// answers an empty page without touching the catalog store (SWHR-R-0092.02).
export default defineHandler((event) => {
  const query = getQuery(event);
  const keywordsParam = typeof query.keywords === "string" ? query.keywords : "";
  const locale = resolveLocale(event);
  const { start, count } = resolvePaging(event);

  return withCatalogErrorHandling(() => {
    const { keywords, items, paging } = searchItems(keywordsParam, locale, start, count);

    return { keywords, items, paging };
  });
});
