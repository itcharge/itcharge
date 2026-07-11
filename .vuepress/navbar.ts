import { defineNavbarConfig } from "vuepress-theme-plume";
import { categoryLink } from "./plugins/categoryUtils";

export default defineNavbarConfig([
  { text: "🏠 主页", link: "/" },
  {
    text: "💻 技术",
    items: [
      { text: "📱 iOS", link: categoryLink("5da0c1") },
      { text: "🐳 服务器", link: categoryLink("14bb1b") },
    ],
  },
  {
    text: "🛠️ 工具",
    items: [
      { text: "🍎 macOS 技巧", link: categoryLink("8449ea") },
      { text: "🔐 账号", link: categoryLink("902dc8") },
    ],
  },
  {
    text: "🌿 生活",
    items: [
      { text: "📝 回顾", link: categoryLink("95d2ba") },
      { text: "📖 阅读", link: categoryLink("5ac114") },
      { text: "🍳 美食", link: categoryLink("075e45") },
      { text: "📚 学习", link: categoryLink("131e32") },
      { text: "✈️ 旅行", link: categoryLink("c5a253") },
    ],
  },
  { text: "🌟 关于", link: "/about/" },
]);
