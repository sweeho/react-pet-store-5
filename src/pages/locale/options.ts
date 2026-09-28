import type { LocaleId } from "../../../lib/locale/model";

export type LocaleOptionLabelKey = "optionEnUs" | "optionDeDe" | "optionJaJp" | "optionZhCn";

/**
 * The four choices the legacy demo screen offered (D6, Q4, SD-3) — the
 * adopted spec keeps German alongside the three storefront locales.
 */
export const LOCALE_CHOICES: ReadonlyArray<{ id: LocaleId; labelKey: LocaleOptionLabelKey }> = [
  { id: "en_US", labelKey: "optionEnUs" },
  { id: "de_DE", labelKey: "optionDeDe" },
  { id: "ja_JP", labelKey: "optionJaJp" },
  { id: "zh_CN", labelKey: "optionZhCn" },
];

export function labelKeyForLocale(id: LocaleId): LocaleOptionLabelKey {
  return LOCALE_CHOICES.find((choice) => choice.id === id)?.labelKey ?? "optionEnUs";
}
