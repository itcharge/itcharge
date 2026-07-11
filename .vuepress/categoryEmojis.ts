/** 分类页展示用 emoji（与导航栏分类保持一致） */
const CATEGORY_EMOJIS: Record<string, string> = {
  生活: "🌿",
  美食: "🍳",
  阅读: "📖",
  学习: "📚",
  回顾: "📝",
  旅行: "✈️",
  技术: "💻",
  服务器: "🐳",
  iOS: "📱",
  工具: "🛠️",
  账号: "🔐",
  "macOS 技巧": "🍎",
};

export function formatCategoryPageTitle(title: string): string {
  const emoji = CATEGORY_EMOJIS[title];
  return emoji ? `${emoji} ${title}` : title;
}
