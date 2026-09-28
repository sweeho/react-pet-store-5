import { defineHandler } from "nitro/h3";

import type { LocaleId } from "../../lib/locale/model";
import { getCartLocale } from "../../lib/locale/session";

export default defineHandler(async (event) => {
  const locale = event.context.locale as LocaleId;
  const cartLocale = await getCartLocale(event);

  return { locale, cartLocale };
});
