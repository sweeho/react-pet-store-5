import { createError, defineHandler, readBody } from "nitro/h3";

import { getAuthSession } from "../../../lib/auth/session";
import { addCartItem, getCart } from "../../../lib/cart/lines";

// Never gated (SWHR-R-0070): adding to the cart requires no sign-on.
export default defineHandler(async (event) => {
  const body = await readBody<{ itemId?: unknown }>(event);
  const itemId = typeof body?.itemId === "string" ? body.itemId : "";
  if (!itemId) {
    throw createError({ statusCode: 400, statusMessage: "itemId is required" });
  }

  const session = await getAuthSession(event, "storefront");
  addCartItem(session.id, itemId);

  const { lines } = await getCart(event, session.id);
  return { lines };
});
