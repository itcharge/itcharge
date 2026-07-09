import { defineCollections } from "vuepress-theme-plume";
import type { PostsCategoryItem } from "vuepress-theme-plume";
import { CATEGORY_LABELS } from "./plugins/categoryUtils";

function translateCategories(
  categories: PostsCategoryItem[],
): PostsCategoryItem[] {
  return categories.map((item) => ({
    ...item,
    name: CATEGORY_LABELS[item.name] ?? item.name,
  }));
}

export default defineCollections([
  {
    type: "post",
    dir: "blogs",
    title: "博客",
    link: "/blogs/",
    autoFrontmatter: {
      permalink: "filepath",
      title: true,
      createTime: true,
    },
    profile: {
      avatar: "/head.png",
      name: "ITCharge",
      description: "高效率编程，慢节奏生活",
      circle: true,
      location: "中国，北京",
      layout: "right",
    },
    social: [
      { icon: "github", link: "https://github.com/itcharge/itcharge" },
      { icon: "gmail", link: "mailto:i@itcharge.cn", ariaLabel: "i@itcharge.cn" },
    ],
    postCover: {
      layout: "left",
      ratio: "4:3",
      width: 280,
    },
    categoriesText: "分类",
    tagsText: "标签",
    categoriesTransform: translateCategories,
  },
]);
