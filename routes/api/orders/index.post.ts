import { defineHandler, readBody } from "nitro/h3";

import { placeOrder } from "../../../lib/checkout/placeOrder";
import type { OrderForm } from "../../../lib/checkout/contact";
import { failureResponse } from "../../../lib/errors/routing";

// Signed-in only (401 from requireSignOn). A failure answers its mapped
// status and body; the SPA routes to `body.screen`.
export default defineHandler(async (event) => {
  const form = await readBody<OrderForm>(event);
  try {
    return await placeOrder(event, form ?? ({} as OrderForm));
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error) throw error;
    const { status, body } = failureResponse(error);
    event.res.status = status;
    return body;
  }
});
