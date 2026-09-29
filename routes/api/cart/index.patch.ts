import { createError, defineHandler, readBody } from "nitro/h3";

import { getAuthSession } from "../../../lib/auth/session";
import { getCart, updateCartQuantities } from "../../../lib/cart/lines";

// Never gated (SWHR-R-0070). Every quantity on the page arrives in one PATCH.
export default defineHandler(async (event) => {
  const body = await readBody<{ quantities?: unknown }>(event);
  const quantities = body?.quantities;
  if (typeof quantities !== "object" || quantities === null || Array.isArray(quantities)) {
    throw createError({ statusCode: 400, statusMessage: "quantities must be an object" });
  }

  const session = await getAuthSession(event, "storefront");
  updateCartQuantities(session.id, quantities as Record<string, unknown>); // narrowed to a plain object above

  return getCart(event, session.id);
});
