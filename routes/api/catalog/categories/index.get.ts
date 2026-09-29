import { defineHandler } from "nitro/h3";

import { listCategories } from "../../../../lib/catalog/queries";
import { resolveLocale, withCatalogErrorHandling } from "../../../../lib/catalog/request";

// Anonymous, read-only (SWHR-R-0097/0098): never gated, never writes.
export default defineHandler((event) => {
  const locale = resolveLocale(event);

  return withCatalogErrorHandling(() => ({ categories: listCategories(locale) }));
});
