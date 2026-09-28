import type { ScreenDefinition } from "../screens";

export default {
  en_US: {
    title: "Cart",
    emptyTitle: "Your cart is empty",
    emptyDescription: "Add an item from the catalog to see it here.",
    quantityLabel: "Quantity",
  },
  ja_JP: {
    title: "カート",
    emptyTitle: "カートは空です",
    emptyDescription: "カタログから商品を追加するとここに表示されます。",
    quantityLabel: "数量",
  },
  zh_CN: {
    title: "购物车",
    emptyTitle: "购物车是空的",
    emptyDescription: "从商品目录中添加商品后会显示在这里。",
    quantityLabel: "数量",
  },
} satisfies ScreenDefinition;
