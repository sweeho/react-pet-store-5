import type { ScreenDefinition } from "../screens";

export default {
  en_US: {
    title: "User Creation Error",
    description:
      "The user name you chose is already in use. Please go back and choose another user name.",
    chooseAnother: "Choose another user name",
    backToHome: "Back to home",
  },
  ja_JP: {
    title: "ユーザー作成エラー",
    description:
      "選択されたユーザー名はすでに使用されています。戻って別のユーザー名を選択してください。",
    chooseAnother: "別のユーザー名を選ぶ",
    backToHome: "ホームに戻る",
  },
  zh_CN: {
    title: "用户创建错误",
    description: "您选择的用户名已被使用，请返回并选择其他用户名。",
    chooseAnother: "选择其他用户名",
    backToHome: "返回首页",
  },
} satisfies ScreenDefinition;
