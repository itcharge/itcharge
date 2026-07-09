import { viteBundler } from "@vuepress/bundler-vite";
import { defineUserConfig } from "vuepress";
import { plumeTheme } from "vuepress-theme-plume";
import { autoCoverFromContentPlugin } from "./plugins/autoCoverFromContent";
import { ensurePostCategoriesPlugin } from "./plugins/ensurePostCategories";
import { fixImageLinksPlugin } from "./plugins/fixImageLinks";

export default defineUserConfig({
  lang: "zh-CN",
  title: "ITCharge",
  description: "高效率编程，慢节奏生活",
  pagePatterns: ["**/*.md", "!.vuepress/**", "!node_modules/**", "!README.md"],
  head: [["meta", { name: "referrer", content: "no-referrer" }]],
  bundler: viteBundler(),
  plugins: [
    ensurePostCategoriesPlugin(),
    fixImageLinksPlugin(),
    autoCoverFromContentPlugin(),
  ],
  theme: plumeTheme({
    configFile: ".vuepress/plume.config.ts",
    markdown: {
      math: false,
    },
    docsRepo: "https://github.com/itcharge/itcharge",
    docsBranch: "master",
    docsDir: "/",
    editLink: true,
    lastUpdated: {
      format: "YYYY-MM-DD HH:mm:ss",
    },
    hostname: "https://itcharge.cn",
  }),
});
