import { defineHandler } from "nitro/h3";

import { getAuthSession } from "../../lib/auth/session";

export default defineHandler(async (event) => {
  const session = await getAuthSession(event, "storefront");
  return { signedOn: session.signedOn, userId: session.userId };
});
