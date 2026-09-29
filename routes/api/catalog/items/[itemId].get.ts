import { createError, defineHandler, getRouterParam } from "nitro/h3";

import { getItem } from "../../../../lib/catalog/queries";
import { resolveLocale, withCatalogErrorHandling } from "../../../../lib/catalog/request";

// Anonymous, read-only (SWHR-R-0097/0098). Missing in the requested locale
// is a 404 (SD6), never a catalog error.
export default defineHandler((event) => {
  const itemId = getRouterParam(event, "itemId") as string;
  const locale = resolveLocale(event);

  return withCatalogErrorHandling(() => {
    const item = getItem(itemId, locale);
    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: `Item ${itemId} not found in ${locale}`,
      });
    }

    return { item };
  });
});
