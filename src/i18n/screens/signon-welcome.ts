import type { ScreenDefinition } from "../screens";

export default {
  en_US: {
    title: "Welcome back",
    signedInAs: "You're signed in as {userId}.",
    body: "Sign-on is complete. From here you can keep browsing, check your account or head to the cart.",
    continueShopping: "Continue shopping",
    viewAccount: "View account",
  },
  ja_JP: {
    title: "おかえりなさい",
    signedInAs: "{userId} としてサインインしています。",
    body: "サインインが完了しました。このまま買い物を続けたり、アカウントやカートを確認できます。",
    continueShopping: "買い物を続ける",
    viewAccount: "アカウントを見る",
  },
  zh_CN: {
    title: "欢迎回来",
    signedInAs: "您已以 {userId} 身份登录。",
    body: "登录已完成。您可以继续浏览、查看账户或前往购物车。",
    continueShopping: "继续购物",
    viewAccount: "查看账户",
  },
} satisfies ScreenDefinition;
