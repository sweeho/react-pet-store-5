import { eq } from "drizzle-orm";
import type { H3Event } from "nitro/h3";

import { db } from "../../db/client";
import { profiles } from "../../db/schema";
import type { LocaleId } from "./model";
import { setSessionLocale } from "./session";

/**
 * Sign-on (D2): a customer's stored preferred language becomes the session
 * and cart locale. A signed-on user with no profile yet (registration step
 * 2 hasn't run) leaves the locale untouched and must not fail.
 */
export async function applyPreferredLanguageOnSignOn(
  event: H3Event,
  userId: string,
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
