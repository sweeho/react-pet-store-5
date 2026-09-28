import { createError, defineHandler, readBody } from "nitro/h3";

import { db } from "../../db/client";
import { customers, profiles } from "../../db/schema";
import { ACCOUNT_CHANGE_PATH } from "../../lib/auth/protection";
import { getAuthSession, updateAuthSession } from "../../lib/auth/session";
import { parseLocale } from "../../lib/locale/model";
import { applyPreferredLanguageOnProfileSave } from "../../lib/locale/preference";
import { getSessionLocale } from "../../lib/locale/session";

/**
 * Registration step 2 (design.md P8, SWHR-R-0072): needs a pending
 * registration from POST /api/users (userId set, not yet signed on).
 * customer-account (swhr-i-0007) replaces this form and extends
 * `customers`/`profiles` — it must not recreate them.
 */
export default defineHandler(async (event) => {
  const session = await getAuthSession(event, "storefront");
  if (!session.userId || session.signedOn) {
    throw createError({ statusCode: 401, statusMessage: "No pending registration" });
  }
  const userId = session.userId;

  const body = await readBody<{ preferredLanguage?: unknown }>(event);
  const requested =
    typeof body?.preferredLanguage === "string" ? parseLocale(body.preferredLanguage) : null;
  const preferredLanguage = requested ? requested.id : await getSessionLocale(event);

  db.transaction((tx) => {
    tx.insert(customers).values({ userId, createdAt: new Date() }).run();
    tx.insert(profiles).values({ userId, preferredLanguage }).run();
  });

  await updateAuthSession(event, "storefront", { signedOn: true });
  await applyPreferredLanguageOnProfileSave(event, preferredLanguage);

  const redirect =
    session.originalUrl && session.originalUrl !== ACCOUNT_CHANGE_PATH ? session.originalUrl : "/";
  return { redirect };
});
