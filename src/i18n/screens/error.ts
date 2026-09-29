import type { ScreenDefinition } from "../screens";

export default {
  en_US: {
    title: "Something went wrong",
    description:
      "We couldn't complete your request. Go back and try again, or return to the home page.",
    tryAgain: "Try again",
    goHome: "Go to home page",
  },
  ja_JP: {
    title: "問題が発生しました",
    description:
      "リクエストを完了できませんでした。戻ってもう一度お試しいただくか、ホームページに戻ってください。",
    tryAgain: "もう一度試す",
    goHome: "ホームページへ",
  },
  zh_CN: {
    title: "出错了",
    description: "我们无法完成您的请求。请返回重试，或回到首页。",
    tryAgain: "重试",
    goHome: "返回首页",
  },
} satisfies ScreenDefinition;
