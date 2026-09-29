import { createError, defineHandler } from "nitro/h3";

import { getCustomerAccount } from "../../../lib/account/customer";
import { toAccountView } from "../../../lib/account/view";
import { requireSignOn } from "../../../lib/auth/protection";

// The user id comes from the session only (R-0123): the caller enforces access.
export default defineHandler(async (event) => {
  const session = await requireSignOn(event);
  const account = session.userId ? getCustomerAccount(session.userId) : null;
  if (!account) {
    throw createError({ statusCode: 404, statusMessage: "No account for this user" });
  }
  return toAccountView(account);
});
