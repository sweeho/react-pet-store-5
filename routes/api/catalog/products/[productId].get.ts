import { createError, defineHandler, getQuery, getRouterParam } from "nitro/h3";

import { getProduct, listProductItems } from "../../../../lib/catalog/queries";
import { parseLocale } from "../../../../lib/locale/model";

export default defineHandler((event) => {
  const productId = getRouterParam(event, "productId") as string;

  // Effective locale (D3, PLAN step 5): the request's own `?locale=` when it
  // parses, else the session locale the middleware already put in context.
  const query = getQuery(event);
  const requestedLocale = typeof query.locale === "string" ? query.locale : undefined;
  const parsedRequestLocale = requestedLocale ? parseLocale(requestedLocale) : null;
  const locale = parsedRequestLocale ? parsedRequestLocale.id : (event.context.locale as string);

  const product = getProduct(productId, locale);
  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: `Product ${productId} not found in ${locale}`,
    });
  }

  const items = listProductItems(productId, locale);

  return { product, items };
});
