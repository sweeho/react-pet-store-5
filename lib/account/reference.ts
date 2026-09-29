import { SUPPORTED_LOCALES, type SupportedLocale } from "../locale/model";

export const CARD_TYPES = ["Java(TM) Card", "Duke Express", "Meow Card"] as const;
export const COUNTRIES = ["United States", "Canada", "Japan", "China"] as const;
export const STATES = ["California", "New York", "Texas"] as const;

export const EXPIRY_MONTHS: readonly string[] = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);

export function expiryYears(now: Date = new Date(), storedYear?: string | null): string[] {
  const current = now.getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => String(current + i));
  if (storedYear && !years.includes(storedYear)) {
    years.push(storedYear);
  }
  return years;
}

export const FAVORITE_CATEGORIES = [
  { id: "BIRDS", label: "Birds" },
  { id: "CATS", label: "Cats" },
  { id: "DOGS", label: "Dogs" },
  { id: "FISH", label: "Fish" },
  { id: "REPTILES", label: "Reptiles" },
] as const;

const LANGUAGE_NAMES: Record<SupportedLocale, string> = {
  en_US: "English",
  ja_JP: "Japanese",
  zh_CN: "Chinese",
};

export const ACCOUNT_LANGUAGES: readonly { id: SupportedLocale; label: string }[] =
  SUPPORTED_LOCALES.map((id) => ({ id, label: `${LANGUAGE_NAMES[id]} (${id})` }));

export const DEFAULT_LANGUAGE = "en_US";
export const DEFAULT_FAVORITE_CATEGORY = "BIRDS";
