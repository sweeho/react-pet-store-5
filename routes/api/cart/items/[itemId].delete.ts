import { defineHandler, getRouterParam } from "nitro/h3";

import { getAuthSession } from "../../../../lib/auth/session";
import { getCart, removeCartItem } from "../../../../lib/cart/lines";

// Never gated (SWHR-R-0070). Removing an absent item is still a 200.
export default defineHandler(async (event) => {
  const itemId = getRouterParam(event, "itemId") as string;
  const session = await getAuthSession(event, "storefront");
  removeCartItem(session.id, itemId);
  return getCart(event, session.id);
});
