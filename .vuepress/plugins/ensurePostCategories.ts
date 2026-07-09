import type { Plugin } from "vuepress/core";
import { buildCategoryListFromPath } from "./categoryUtils";

/**
 * 补全文章分类信息。
 * 主题 extendsPage 在配置加载前执行时，autoCategory 可能失败，导致分类数为 0。
 */
export const ensurePostCategoriesPlugin = (): Plugin => ({
  name: "ensure-post-categories",

  extendsPage(page) {
    if (page.frontmatter.article === false) return;
    if (!page.filePathRelative?.startsWith("blogs/")) return;

    const categoryList = buildCategoryListFromPath(page.filePathRelative);
    if (categoryList.length)
      page.data.categoryList = categoryList;
  },
});
