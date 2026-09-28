import { createError, defineHandler, readBody } from "nitro/h3";

import { parseLocale } from "../../lib/locale/model";
import { setSessionLocale } from "../../lib/locale/session";

export default defineHandler(async (event) => {
  const body = await readBody<{ locale?: unknown }>(event);
  const input = typeof body?.locale === "string" ? body.locale : "";
  const parsed = parseLocale(input);

  if (!parsed) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unable to change language to ${input}`,
    });
  }

  await setSessionLocale(event, parsed.id);
  event.context.locale = parsed.id;

  return { locale: parsed.id };
});
