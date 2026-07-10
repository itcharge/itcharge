import fs from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vuepress/core";

const IMG_NO_REFERRER_RE = /<img\b(?![^>]*\breferrerpolicy=)([^>]*)>/gi;

async function* walkHtmlFiles(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkHtmlFiles(fullPath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".html"))
      yield fullPath;
  }
}

function addNoReferrerToImgTags(html: string): string {
  return html.replace(
    IMG_NO_REFERRER_RE,
    '<img referrerpolicy="no-referrer"$1>',
  );
}

export const noReferrerOnImagesPlugin = (): Plugin => ({
  name: "no-referrer-on-images",

  extendsMarkdown(md) {
    const defaultRender =
      md.renderer.rules.image
      ?? ((tokens, idx, options, env, self) =>
        self.renderToken(tokens, idx, options));

    md.renderer.rules.image = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      if (token.attrIndex("referrerpolicy") < 0)
        token.attrPush(["referrerpolicy", "no-referrer"]);

      return defaultRender(tokens, idx, options, env, self);
    };
  },

  async onGenerated(app) {
    const dest = app.dir.dest();

    for await (const file of walkHtmlFiles(dest)) {
      const html = await fs.readFile(file, "utf-8");
      const updated = addNoReferrerToImgTags(html);
      if (updated !== html)
        await fs.writeFile(file, updated);
    }
  },
});
