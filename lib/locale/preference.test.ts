import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { profiles, users } from "../../db/schema";
import { applyPreferredLanguageOnProfileSave, applyPreferredLanguageOnSignOn } from "./preference";
import { getCartLocale, getSessionLocale } from "./session";

/**
 * INTEGRATION TEST
 *
 * Exercises lib/locale/preference.ts against the real (in-memory under
 * Vitest) database and real H3 sessions — the seam the sign-on and account
 * capabilities call.
 */
function createUser(userId: string): string {
  const user = db.insert(users).values({ userId, passwordHash: "hash" }).returning().get();
  return user.userId;
}

describe("applyPreferredLanguageOnSignOn", () => {
  it("[AC-1] switches the session locale and the cart locale to the customer's Japanese preference", async () => {
    const userId = createUser("ja-preference-user");
    db.insert(profiles).values({ userId, preferredLanguage: "ja_JP" }).run();

    const event = new H3Event(new Request("http://localhost/"));
    await expect(getSessionLocale(event)).resolves.toBe("en_US");

    await applyPreferredLanguageOnSignOn(event, userId);

    await expect(getSessionLocale(event)).resolves.toBe("ja_JP");
    await expect(getCartLocale(event)).resolves.toBe("ja_JP");
  });

  it("[AC-3] succeeds and leaves the session locale unchanged for a user with no profile", async () => {
    const userId = createUser("no-profile-user");

    const event = new H3Event(new Request("http://localhost/"));
    await expect(getSessionLocale(event)).resolves.toBe("en_US");

    await expect(applyPreferredLanguageOnSignOn(event, userId)).resolves.toBeUndefined();

    await expect(getSessionLocale(event)).resolves.toBe("en_US");
  });
});

describe("applyPreferredLanguageOnProfileSave", () => {
  it("[AC-2] switches the session locale and the cart locale to the newly saved preference", async () => {
    const event = new H3Event(new Request("http://localhost/"));
    await expect(getSessionLocale(event)).resolves.toBe("en_US");

    await applyPreferredLanguageOnProfileSave(event, "zh_CN");

    await expect(getSessionLocale(event)).resolves.toBe("zh_CN");
    await expect(getCartLocale(event)).resolves.toBe("zh_CN");
  });
});

describe("profiles.preferredLanguage default", () => {
  it("[AC-4] defaults to en_US when a profile is created without a language", () => {
    const userId = createUser("default-language-user");

    db.insert(profiles).values({ userId }).run();

    const profile = db.select().from(profiles).where(eq(profiles.userId, userId)).get();
    expect(profile?.preferredLanguage).toBe("en_US");
  });
});
