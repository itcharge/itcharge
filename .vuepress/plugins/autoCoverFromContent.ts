import type { Plugin } from "vuepress/core";
import { extractFirstImageUrl } from "./imageLinkUtils";

export const autoCoverFromContentPlugin = (): Plugin => ({
  name: "auto-cover-from-content",

  extendsPage(page) {
    if (page.frontmatter.cover || page.frontmatter.article === false) return;
    if (!page.filePathRelative?.startsWith("blogs/")) return;

    const cover = extractFirstImageUrl(page.content);
    if (cover) page.frontmatter.cover = cover;
  },
});
