import { defineHandler } from "nitro/h3";

import { getAuthSession } from "../../../lib/auth/session";
import { getCartWithDetails } from "../../../lib/cart/lines";

// Never gated (SWHR-R-0070): an anonymous shopper has a cart identified by
// their own (anonymous) storefront session.
export default defineHandler(async (event) => {
  const session = await getAuthSession(event, "storefront");
  const lines = await getCartWithDetails(event, session.id);
  return { lines };
});
