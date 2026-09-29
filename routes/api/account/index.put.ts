import { createError, defineHandler, readBody } from "nitro/h3";

import { getCustomerAccount, replaceCustomerAccount } from "../../../lib/account/customer";
import { parseAccountForm, type AccountFormInput } from "../../../lib/account/form";
import { toAccountView } from "../../../lib/account/view";
import { requireSignOn } from "../../../lib/auth/protection";
import { applyPreferredLanguageOnProfileSave } from "../../../lib/locale/preference";

// Replaces contact, address, card and profile for the session's own customer
// (P8); a userId in the body is ignored.
export default defineHandler(async (event) => {
  const session = await requireSignOn(event);
  const userId = session.userId;
  const stored = userId ? getCustomerAccount(userId) : null;
  if (!userId || !stored) {
    throw createError({ statusCode: 404, statusMessage: "No account for this user" });
  }

  const body = await readBody<AccountFormInput>(event);
  const result = parseAccountForm(body ?? {}, "update", stored.creditCard.cardLastFour);
  if (!result.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: "Required fields missing",
      data: { missing: result.missing },
    });
  }

  replaceCustomerAccount(userId, result.value);
  await applyPreferredLanguageOnProfileSave(event, result.value.profile.preferredLanguage);

  return toAccountView(getCustomerAccount(userId) ?? stored);
});
