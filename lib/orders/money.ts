import type { LocaleId } from "../locale/model";

// Same split as `formatPrice`: 2 fraction digits for en_US/zh_CN, 0 for ja_JP.
const FRACTION_DIGITS: Record<string, number> = {
  en_US: 2,
  zh_CN: 2,
  ja_JP: 0,
};

function digitsFor(locale: LocaleId): number {
  const digits = FRACTION_DIGITS[locale];
  if (digits === undefined) {
    throw new Error(`Unsupported locale for order money: ${locale}`);
  }
  return digits;
}

/** Exact integer minor units -> decimal string. Integer/string arithmetic only. */
export function minorToDecimal(minor: number, locale: LocaleId): string {
  const digits = digitsFor(locale);
  if (!Number.isSafeInteger(minor) || minor < 0) {
    throw new Error(`Invalid minor amount: ${minor}`);
  }
  if (digits === 0) return String(minor);
  const padded = String(minor).padStart(digits + 1, "0");
  return `${padded.slice(0, -digits)}.${padded.slice(-digits)}`;
}

/** Exact decimal string -> integer minor units; never rounds. */
export function decimalToMinor(value: string, locale: LocaleId): number {
  const digits = digitsFor(locale);
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) {
    throw new Error(`Invalid decimal amount: "${value}"`);
  }
  const whole = match[1];
  const fraction = match[2] ?? "";
  if (fraction.length > digits) {
    throw new Error(`Too many fraction digits in "${value}" for ${locale} (max ${digits})`);
  }
  const minor = Number(whole + fraction.padEnd(digits, "0"));
  if (!Number.isSafeInteger(minor)) {
    throw new Error(`Amount out of range: "${value}"`);
  }
  return minor;
}
