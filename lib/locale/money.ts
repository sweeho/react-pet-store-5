import type { LocaleId } from "./model";

// No currency conversion (D4, SWHR-R-0015): each locale's price is its own
// stored row, formatted in that locale's own currency convention only.
const CURRENCY_BY_LOCALE: Record<string, string> = {
  en_US: "USD",
  ja_JP: "JPY",
  zh_CN: "CNY",
};

// Integer minor units (SD-8): cents for USD/CNY, whole yen for JPY (JPY has
// no minor currency unit in everyday use).
const MINOR_UNIT_DIVISOR: Record<string, number> = {
  USD: 100,
  CNY: 100,
  JPY: 1,
};

export function formatPrice(minor: number, locale: LocaleId): string {
  // An unsupported locale falls back to en_US entirely (currency AND
  // formatting convention) rather than mixing, e.g., German number
  // formatting with a US dollar sign.
  const effectiveLocale = CURRENCY_BY_LOCALE[locale] ? locale : "en_US";
  const currency = CURRENCY_BY_LOCALE[effectiveLocale];
  const divisor = MINOR_UNIT_DIVISOR[currency] ?? 100;

  return new Intl.NumberFormat(effectiveLocale.replace("_", "-"), {
    style: "currency",
    currency,
  }).format(minor / divisor);
}
