import { eq } from "drizzle-orm";
import type { H3Event } from "nitro/h3";

import { db } from "../../db/client";
import { profiles } from "../../db/schema";
import type { LocaleId } from "./model";
import { setSessionLocale } from "./session";

/**
 * Sign-on (D2): a customer's stored preferred language becomes the session
 * and cart locale. A sign-on account with no profile yet (SD-1 seam — the
 * sign-on capability doesn't exist in this sprint) leaves the locale
 * untouched and must not fail.
 */
export async function applyPreferredLanguageOnSignOn(
  event: H3Event,
  userId: number,
): Promise<void> {
  const profile = db.select().from(profiles).where(eq(profiles.userId, userId)).get();
  if (!profile) {
    return;
  }

  await setSessionLocale(event, profile.preferredLanguage);
}

/**
 * Profile save (D2): the newly saved preferred language becomes the session
 * and cart locale immediately, the same as sign-on.
 */
export async function applyPreferredLanguageOnProfileSave(
  event: H3Event,
  preferredLanguage: LocaleId,
): Promise<void> {
  await setSessionLocale(event, preferredLanguage);
}
