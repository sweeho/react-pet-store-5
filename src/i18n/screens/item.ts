import type { ScreenDefinition } from "../screens";

export default {
  en_US: {
    listPriceLabel: "List Price",
    yourPriceLabel: "Your Price",
    addToCart: "Add to Cart",
    addedToCart: "Added to cart",
    notFoundTitle: "Item not found",
    notFoundDescription: "This item isn't available in your current language.",
  },
  ja_JP: {
    listPriceLabel: "定価",
    yourPriceLabel: "販売価格",
    addToCart: "カートに追加",
    addedToCart: "カートに追加しました",
    notFoundTitle: "商品が見つかりません",
    notFoundDescription: "この商品は現在の言語ではご利用いただけません。",
  },
  zh_CN: {
    listPriceLabel: "标价",
    yourPriceLabel: "优惠价",
    addToCart: "加入购物车",
    addedToCart: "已加入购物车",
    notFoundTitle: "未找到商品",
    notFoundDescription: "该商品在当前语言下不可用。",
  },
} satisfies ScreenDefinition;
