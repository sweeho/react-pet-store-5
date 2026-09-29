import type { ScreenDefinition } from "../screens";

export default {
  en_US: {
    fallbackTitle: "Category",
    emptyTitle: "No pets to show here",
    emptyDescription:
      "There are no pets in this category right now. Pick another kind of pet from the Pets menu, or search by name.",
    backToHome: "Back to home",
  },
  ja_JP: {
    fallbackTitle: "カテゴリー",
    emptyTitle: "表示できるペットがありません",
    emptyDescription:
      "現在このカテゴリーにはペットがいません。Petsメニューから別の種類を選ぶか、名前で検索してください。",
    backToHome: "ホームに戻る",
  },
  zh_CN: {
    fallbackTitle: "分类",
    emptyTitle: "此分类下暂无宠物",
    emptyDescription: "此分类目前没有宠物。请从宠物菜单选择其他种类，或按名称搜索。",
    backToHome: "返回首页",
  },
} satisfies ScreenDefinition;
