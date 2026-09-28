import type { H3Event } from "nitro/h3";
import { useSession } from "nitro/h3";

import type { LocaleId } from "./model";
import { getDefaultLocale } from "./model";

interface LocaleSessionData {
  locale?: string;
  cartLocale?: string;
}

// iron-seal (the session-sealing library behind h3's useSession) requires a
// password of at least 32 characters. This fallback only ever runs outside
// production, when the deployment hasn't set SESSION_PASSWORD yet.
const DEV_SESSION_PASSWORD = "dev-only-insecure-session-password-swhr";

function sessionPassword(): string {
  const configured = process.env.SESSION_PASSWORD;
  if (configured) {
    return configured;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_PASSWORD must be set in production");
  }
  return DEV_SESSION_PASSWORD;
}

function localeSession(event: H3Event) {
  // Not a React hook: h3's useSession() is a plain server-side session
  // helper that merely happens to share React's "use" naming convention.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSession<LocaleSessionData>(event, {
    password: sessionPassword(),
  });
}

export async function getSessionLocale(event: H3Event): Promise<LocaleId> {
  const session = await localeSession(event);
  if (session.data.locale) {
    return session.data.locale;
  }

  const defaultLocale = getDefaultLocale();
  await session.update({ locale: defaultLocale });
  return defaultLocale;
}

export async function setSessionLocale(event: H3Event, locale: LocaleId): Promise<void> {
  const session = await localeSession(event);
  await session.update({ locale, cartLocale: locale });
}

export async function getCartLocale(event: H3Event): Promise<LocaleId> {
  const session = await localeSession(event);
  return session.data.cartLocale ?? getDefaultLocale();
}
