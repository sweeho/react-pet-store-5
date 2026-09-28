import type { LocaleId } from "./model";

export interface StateProvinceOption {
  value: string;
  label: string;
}

// Labels are in the page's own locale, mirroring the legacy per-locale
// enter_order_information.jsp screens (design D6); no reference data backs
// these lists. `value` is a stable English slug for the order form
// (SWHR-T-0019+) to submit.
const STATE_PROVINCE_OPTIONS: Record<string, StateProvinceOption[]> = {
  en_US: [
    { value: "california", label: "California" },
    { value: "new-york", label: "New York" },
    { value: "texas", label: "Texas" },
  ],
  ja_JP: [
    { value: "tokyo", label: "東京" },
    { value: "osaka", label: "大阪" },
    { value: "nagano", label: "長野" },
  ],
  zh_CN: [
    { value: "beijing", label: "北京" },
    { value: "shanghai", label: "上海" },
    { value: "jiangsu", label: "江苏" },
  ],
};

export function getStateProvinceOptions(locale: LocaleId): StateProvinceOption[] {
  return STATE_PROVINCE_OPTIONS[locale] ?? STATE_PROVINCE_OPTIONS.en_US;
}
