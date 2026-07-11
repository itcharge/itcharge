import { viteBundler } from "@vuepress/bundler-vite";
import { defineUserConfig } from "vuepress";
import { getDirname, path } from "vuepress/utils";
import { plumeTheme } from "vuepress-theme-plume";
import { getGiscusConfig } from "./giscus";
import { autoCoverFromContentPlugin } from "./plugins/autoCoverFromContent";
import { blockquoteStylePlugin } from "./plugins/blockquoteStyle";
import { ensurePostCategoriesPlugin } from "./plugins/ensurePostCategories";
import { fixImageLinksPlugin } from "./plugins/fixImageLinks";
import { noReferrerOnImagesPlugin } from "./plugins/noReferrerOnImages";

const giscus = getGiscusConfig();
const __dirname = getDirname(import.meta.url);

export default defineUserConfig({
  lang: "zh-CN",
  title: "ITCharge",
  description: "高效率编程，慢节奏生活",
  pagePatterns: ["**/*.md", "!.vuepress/**", "!node_modules/**", "!README.md"],
  // qcdn 防盗链：任何 Referer 都会 403，必须全局 no-referrer
  head: [["meta", { name: "referrer", content: "no-referrer" }]],
  bundler: viteBundler({
    viteOptions: {
      resolve: {
        alias: {
          "@theme/Posts/VPCategoriesGroup.vue": path.resolve(
            __dirname,
            "theme/components/Posts/VPCategoriesGroup.vue",
          ),
        },
      },
    },
  }),
  plugins: [
    ensurePostCategoriesPlugin(),
    fixImageLinksPlugin(),
    noReferrerOnImagesPlugin(),
    autoCoverFromContentPlugin(),
    blockquoteStylePlugin(),
  ],
  theme: plumeTheme({
    configFile: ".vuepress/plume.config.ts",
    markdown: {
      math: false,
      image: {
        figure: true,
        lazyload: true,
      },
      table: true,
    },
    docsRepo: "https://github.com/itcharge/itcharge",
    docsBranch: "main",
    docsDir: "/",
    editLink: true,
    lastUpdated: {
      format: "YYYY-MM-DD HH:mm:ss",
    },
    hostname: "https://itcharge.cn",
    ...(giscus ? { comment: giscus } : {}),
  }),
});
