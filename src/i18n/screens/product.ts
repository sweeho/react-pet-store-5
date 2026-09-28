import type { ScreenDefinition } from "../screens";

export default {
  en_US: {
    listPriceLabel: "List Price",
    notFoundTitle: "Item not found",
    notFoundDescription: "This item isn't available in your current language.",
  },
  ja_JP: {
    listPriceLabel: "定価",
    notFoundTitle: "商品が見つかりません",
    notFoundDescription: "この商品は現在の言語ではご利用いただけません。",
  },
  zh_CN: {
    listPriceLabel: "标价",
    notFoundTitle: "未找到商品",
    notFoundDescription: "该商品在当前语言下不可用。",
  },
} satisfies ScreenDefinition;
