import type { LocaleId } from "../locale/model";

/** Minor-unit thresholds; `null` means orders in that locale are never auto-approved. */
export const AUTO_APPROVAL_THRESHOLDS: Record<LocaleId, number | null> = {
  en_US: 50000,
  ja_JP: 50000,
  zh_CN: null,
};

/** Strictly below the locale's threshold; no conversion, and never for a null threshold or unknown locale. */
export function shouldAutoApprove(locale: LocaleId, totalMinor: number): boolean {
  const threshold = AUTO_APPROVAL_THRESHOLDS[locale];
  return threshold != null && totalMinor < threshold;
}
