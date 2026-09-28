import type { ScreenDefinition } from "../screens";

export default {
  en_US: {
    title: "Search",
    resultsForTemplate: 'Search results for "{keyword}"',
    comingSoonTitle: "Coming soon",
    comingSoonDescription: "Search is coming soon.",
  },
  ja_JP: {
    title: "検索",
    resultsForTemplate: "「{keyword}」の検索結果",
    comingSoonTitle: "近日公開",
    comingSoonDescription: "検索機能は近日公開予定です。",
  },
  zh_CN: {
    title: "搜索",
    resultsForTemplate: "“{keyword}”的搜索结果",
    comingSoonTitle: "即将推出",
    comingSoonDescription: "搜索功能即将推出。",
  },
} satisfies ScreenDefinition;
