import type { LocaleId } from "../locale/model";

/**
 * Email price formats are distinct from storefront formatting (Q2/SD-9):
 * default, en_US and zh_CN all use the dollar pattern `$#,##0.00`; ja_JP
 * uses the yen pattern `￥#,##0`, with no decimals.
 */
export function formatEmailPrice(amount: number, templateLocale: LocaleId | "default"): string {
  if (templateLocale === "ja_JP") {
    return `￥${Math.round(amount).toLocaleString("en-US")}`;
  }

  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
