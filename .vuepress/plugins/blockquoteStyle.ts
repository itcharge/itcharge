import type { Plugin } from "vuepress";

export const blockquoteStylePlugin = (): Plugin => ({
  name: "blockquote-style",

  extendsMarkdown(md) {
    md.renderer.rules.blockquote_open = (
      tokens,
      idx,
      options,
      env,
      self,
    ) => {
      tokens[idx].attrSet("class", "itcharge-blockquote");
      return self.renderToken(tokens, idx, options, env);
    };
  },
});
