import type { ScreenDefinition } from "../screens";

export default {
  en_US: {
    listPriceLabel: "List Price",
    notFoundTitle: "Item not found",
    notFoundDescription: "This item isn't available in your current language.",
    addToCart: "Add to Cart",
    addedToCart: "Added to cart",
  },
  ja_JP: {
    listPriceLabel: "定価",
    notFoundTitle: "商品が見つかりません",
    notFoundDescription: "この商品は現在の言語ではご利用いただけません。",
    addToCart: "カートに追加",
    addedToCart: "カートに追加しました",
  },
  zh_CN: {
    listPriceLabel: "标价",
    notFoundTitle: "未找到商品",
    notFoundDescription: "该商品在当前语言下不可用。",
    addToCart: "加入购物车",
    addedToCart: "已加入购物车",
  },
} satisfies ScreenDefinition;
