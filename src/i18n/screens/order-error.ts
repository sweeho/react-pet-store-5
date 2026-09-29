import type { ScreenDefinition } from "../screens";

export default {
  en_US: {
    title: "Order Error",
    description: "Your shopping cart is empty, so the order could not be placed.",
    note: "If you submitted an order that was already placed, that order went through and its confirmation e-mail will follow.",
    continueShopping: "Continue shopping",
    viewCart: "View cart",
  },
  ja_JP: {
    title: "注文エラー",
    description: "ショッピングカートが空のため、注文できませんでした。",
    note: "すでに確定した注文を再送信した場合、その注文は受け付け済みで、確認メールが届きます。",
    continueShopping: "買い物を続ける",
    viewCart: "カートを見る",
  },
  zh_CN: {
    title: "订单错误",
    description: "您的购物车是空的，因此无法下单。",
    note: "如果您重复提交了已下的订单，该订单已成功，确认邮件随后会发送。",
    continueShopping: "继续购物",
    viewCart: "查看购物车",
  },
} satisfies ScreenDefinition;
