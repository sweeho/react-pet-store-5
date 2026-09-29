// P5: the form always composes MM/YYYY, so the fallback is reached only by
// bad stored data. Month is the text before the first "/", year all text after.
const FALLBACK_MONTH = "01";
const FALLBACK_YEAR = "2010";

export function composeExpiry(month: string, year: string): string {
  return `${month}/${year}`;
}

function split(expiry: string | null | undefined): [string, string] {
  if (!expiry) return [FALLBACK_MONTH, FALLBACK_YEAR];
  const at = expiry.indexOf("/");
  if (at < 0) return [FALLBACK_MONTH, FALLBACK_YEAR];
  return [expiry.slice(0, at), expiry.slice(at + 1)];
}

export function expiryMonth(expiry: string | null | undefined): string {
  return split(expiry)[0];
}

export function expiryYear(expiry: string | null | undefined): string {
  return split(expiry)[1];
}
