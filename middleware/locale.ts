import { defineHandler } from "nitro/h3";

import { getSessionLocale } from "../lib/locale/session";

export default defineHandler(async (event) => {
  event.context.locale = await getSessionLocale(event);
});
