import fs from "node:fs/promises";
import type { Plugin } from "vuepress/core";
import { fixImageLinksInMarkdown } from "./imageLinkUtils";

async function resolvePageMarkdown(options: {
  content?: string;
  filePath?: string;
}): Promise<string | undefined> {
  if (typeof options.content === "string")
    return options.content;

  if (options.filePath)
    return fs.readFile(options.filePath, "utf-8");

  return undefined;
}

export const fixImageLinksPlugin = (): Plugin => ({
  name: "fix-image-links",

  extendsPageOptions: async (options) => {
    const filePath = options.filePath?.replace(/\\/g, "/");
    if (!filePath?.includes("/blogs/") && !filePath?.startsWith("blogs/"))
      return;

    const content = await resolvePageMarkdown(options);
    if (!content) return;

    options.content = fixImageLinksInMarkdown(content);
  },

  extendsMarkdown(md) {
    md.core.ruler.before("normalize", "fix-image-links", (state) => {
      state.src = fixImageLinksInMarkdown(state.src);
    });
  },
});
