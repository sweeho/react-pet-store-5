import type { ScreenDefinition } from "../screens";

export default {
  en_US: {
    title: "Search results",
    matchingKeywordsPrefix: "Items matching any of:",
    yourPriceLabel: "Your Price",
    addToCart: "Add to Cart",
    addedToCart: "Added to cart",
    noResultsTitle: "No results were found for your search.",
    noResultsDescription:
      "Search matches pet names, descriptions and kinds of pet. Try a shorter word, or browse from the Pets menu.",
  },
  ja_JP: {
    title: "検索結果",
    matchingKeywordsPrefix: "次のいずれかに一致する商品:",
    yourPriceLabel: "販売価格",
    addToCart: "カートに追加",
    addedToCart: "カートに追加しました",
    noResultsTitle: "検索条件に一致する商品が見つかりませんでした。",
    noResultsDescription:
      "検索はペットの名前、説明、種類に一致します。短いキーワードを試すか、Petsメニューから探してください。",
  },
  zh_CN: {
    title: "搜索结果",
    matchingKeywordsPrefix: "匹配以下任意关键词的商品:",
    yourPriceLabel: "优惠价",
    addToCart: "加入购物车",
    addedToCart: "已加入购物车",
    noResultsTitle: "未找到与您的搜索匹配的结果。",
    noResultsDescription: "搜索匹配宠物名称、描述和种类。请尝试更短的关键词，或从宠物菜单浏览。",
  },
} satisfies ScreenDefinition;
