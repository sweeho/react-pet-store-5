import type { ScreenDefinition } from "../screens";

export default {
  en_US: {
    title: "You are signed out",
    description:
      "Thank you for shopping at Pet Store. Your cart has been emptied — come back any time.",
    signInAgain: "Sign in again",
    keepBrowsing: "Keep browsing",
  },
  ja_JP: {
    title: "サインアウトしました",
    description:
      "Pet Storeをご利用いただきありがとうございました。カートは空になりました。またのご利用をお待ちしております。",
    signInAgain: "もう一度サインインする",
    keepBrowsing: "引き続き見る",
  },
  zh_CN: {
    title: "您已退出登录",
    description: "感谢您在Pet Store购物。您的购物车已清空——欢迎随时回来。",
    signInAgain: "重新登录",
    keepBrowsing: "继续浏览",
  },
} satisfies ScreenDefinition;
