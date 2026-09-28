export const SUPPORTED_LOCALES = ["en_US", "ja_JP", "zh_CN"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type LocaleId = string;

export interface ParsedLocale {
  id: LocaleId;
  language: string;
  country: string;
}

export function getDefaultLocale(): LocaleId {
  // Shared by server and SPA (P1): `process` only exists server-side, so
  // guard it rather than assume a Node/Bun global is present in the browser.
  const configured = typeof process !== "undefined" ? process.env.DEFAULT_LOCALE : undefined;
  return configured || "en_US";
}

export function parseLocale(input: string | null | undefined): ParsedLocale | null {
  if (!input) {
    return null;
  }

  if (input.toLowerCase() === "default") {
    return parseLocale(getDefaultLocale());
  }

  const parts = input.split("_");
  if (parts.length !== 2) {
    return null;
  }

  const [language, country] = parts;
  if (!language || !country) {
    return null;
  }

  return { id: `${language}_${country}`, language, country };
}

export function isSupportedLocale(id: string): id is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(id);
}
