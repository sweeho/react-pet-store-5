import { createError, defineHandler, getRouterParam } from "nitro/h3";

import { getProduct, listItems } from "../../../../lib/catalog/queries";
import {
  resolveLocale,
  resolvePaging,
  withCatalogErrorHandling,
} from "../../../../lib/catalog/request";

// Anonymous, read-only (SWHR-R-0097/0098). Missing in the requested locale
// is a 404 (SD6), never a catalog error.
export default defineHandler((event) => {
  const productId = getRouterParam(event, "productId") as string;
  const locale = resolveLocale(event);
  const { start, count } = resolvePaging(event);

  return withCatalogErrorHandling(() => {
    const product = getProduct(productId, locale);
    if (!product) {
      throw createError({
        statusCode: 404,
        statusMessage: `Product ${productId} not found in ${locale}`,
      });
    }

    const { items, paging } = listItems(productId, locale, start, count);

    return { product, items, paging };
  });
});
