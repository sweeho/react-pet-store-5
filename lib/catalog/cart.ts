import type { H3Event } from "nitro/h3";

import { getCartLocale } from "../locale/session";
import { getItem, type ItemView } from "./queries";

/**
 * Cart item details come from the cart's own locale (P5, SWHR-R-0016), not
 * the request's session locale — they can differ (e.g. a locale switch that
 * hasn't yet been mirrored onto the cart). `getCartLocale` already defaults
 * to en_US until the cart locale is ever set (T-0014).
 */
export async function getCartItemDetails(event: H3Event, itemIds: string[]): Promise<ItemView[]> {
  const locale = await getCartLocale(event);

  const items: ItemView[] = [];
  for (const itemId of itemIds) {
    const view = getItem(itemId, locale);
    if (view) {
      items.push(view);
    }
  }

  return items;
}
