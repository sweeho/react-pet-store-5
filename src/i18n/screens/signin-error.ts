import type { ScreenDefinition } from "../screens";

export default {
  en_US: {
    title: "Sign-in Error",
    description:
      "The user name and password you entered were not found in our records. Please try again.",
    tryAgain: "Try again",
    backToHome: "Back to home",
  },
  ja_JP: {
    title: "サインインエラー",
    description:
      "入力されたユーザー名またはパスワードが登録情報と一致しませんでした。もう一度お試しください。",
    tryAgain: "もう一度試す",
    backToHome: "ホームに戻る",
  },
  zh_CN: {
    title: "登录错误",
    description: "您输入的用户名和密码与我们的记录不匹配，请重试。",
    tryAgain: "重试",
    backToHome: "返回首页",
  },
} satisfies ScreenDefinition;
