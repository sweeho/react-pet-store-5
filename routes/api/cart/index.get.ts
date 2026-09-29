import { defineHandler } from "nitro/h3";

import { getAuthSession } from "../../../lib/auth/session";
import { getCart } from "../../../lib/cart/lines";

// Never gated (SWHR-R-0070): an anonymous shopper has a cart identified by
// their own (anonymous) storefront session.
export default defineHandler(async (event) => {
  const session = await getAuthSession(event, "storefront");
  const cart = await getCart(event, session.id);
  // Legacy shape (nested `item`) until SWHR-T-0098/0099 move the page to CartView.
  return {
    lines: cart.lines.map((line) => ({
      ...line,
      item: { name: line.name, listPrice: line.unitCost },
    })),
  };
});
