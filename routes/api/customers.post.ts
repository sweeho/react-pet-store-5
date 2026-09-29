import { createError, defineHandler, readBody } from "nitro/h3";

import { db } from "../../db/client";
import { createCustomer, replaceCustomerAccount } from "../../lib/account/customer";
import { parseAccountForm, type AccountFormInput } from "../../lib/account/form";
import { ACCOUNT_CHANGE_PATH } from "../../lib/auth/protection";
import { getAuthSession, updateAuthSession } from "../../lib/auth/session";
import { applyPreferredLanguageOnProfileSave } from "../../lib/locale/preference";

/**
 * Registration step 2 (design.md P8, SWHR-R-0072): needs a pending
 * registration from POST /api/users (userId set, not yet signed on).
 * Takes the full account form (swhr-i-0007 P8); customer, account, contact,
 * address, card and profile are written in one transaction.
 */
export default defineHandler(async (event) => {
  const session = await getAuthSession(event, "storefront");
  if (!session.userId || session.signedOn) {
    throw createError({ statusCode: 401, statusMessage: "No pending registration" });
  }
  const userId = session.userId;

  const body = await readBody<AccountFormInput>(event);
  const result = parseAccountForm(body ?? {}, "create");
  if (!result.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: "Required fields missing",
      data: { missing: result.missing },
    });
  }
  const { preferredLanguage } = result.value.profile;

  db.transaction((tx) => {
    createCustomer(userId, tx);
    replaceCustomerAccount(userId, result.value, tx);
  });

  await updateAuthSession(event, "storefront", { signedOn: true });
  await applyPreferredLanguageOnProfileSave(event, preferredLanguage);

  const redirect =
    session.originalUrl && session.originalUrl !== ACCOUNT_CHANGE_PATH ? session.originalUrl : "/";
  return { redirect };
});
