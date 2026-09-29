import type { LocaleId } from "../locale/model";

/** Minor-unit thresholds; `null` means orders in that locale are never auto-approved. */
export const AUTO_APPROVAL_THRESHOLDS: Record<LocaleId, number | null> = {
  en_US: 50000,
  ja_JP: 50000,
  zh_CN: null,
};
