import { eq } from "drizzle-orm";
import { createError, defineHandler } from "nitro/h3";

import { sessions } from "../../../db/schema";
import { requireSignOn } from "../../../lib/auth/protection";
import { withReadTransaction } from "../../../lib/db/readTransaction";

// The order complete screen's read (design.md P8): the session's last order.
export default defineHandler(async (event) => {
  const session = await requireSignOn(event);
  const row = withReadTransaction((tx) =>
    tx
      .select({ orderId: sessions.lastOrderId, email: sessions.lastOrderEmail })
      .from(sessions)
      .where(eq(sessions.id, session.id))
      .get(),
  );
  if (!row?.orderId) {
    throw createError({ statusCode: 404, statusMessage: "No order placed in this session" });
  }
  return { orderId: row.orderId, email: row.email ?? "" };
});
