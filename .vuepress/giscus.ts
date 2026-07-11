import type { CommentPluginOptions } from "@vuepress/plugin-comment";

const GISCUS_REPO = "itcharge/itcharge";
const GISCUS_REPO_ID = "MDEwOlJlcG9zaXRvcnkyNzQwODE5MDc=";
const GISCUS_CATEGORY = "Comments";
const GISCUS_CATEGORY_ID = "DIC_kwDOEFYoc84DA5WQ";

export function getGiscusConfig(): CommentPluginOptions | false {
  if (!GISCUS_REPO_ID || !GISCUS_CATEGORY_ID) {
    console.warn(
      "[giscus] 评论未启用：请在 .vuepress/giscus.ts 中填写 GISCUS_REPO_ID 和 GISCUS_CATEGORY_ID",
    );
    return false;
  }

  return {
    provider: "Giscus",
    comment: true,
    repo: GISCUS_REPO,
    repoId: GISCUS_REPO_ID,
    category: GISCUS_CATEGORY,
    categoryId: GISCUS_CATEGORY_ID,
    mapping: "pathname",
    strict: false,
    lazyLoading: true,
    reactionsEnabled: true,
    inputPosition: "top",
    lightTheme: "light",
    darkTheme: "dark",
    // circle-clip 动效 650ms，延迟更新避免切换过程中样式错位
    delay: 850,
  };
}
