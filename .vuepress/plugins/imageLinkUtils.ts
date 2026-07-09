const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?[^)\s]*)?$/i;

/** 将指向图片的 Markdown 链接语法转为图片语法 */
const LINK_AS_IMAGE_RE = /(?<!!)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

export function isImageUrl(url: string): boolean {
  const normalized = url.replace(/^["']|["']$/g, "").trim();
  return IMAGE_EXT_RE.test(normalized);
}

export function fixImageLinksInMarkdown(content: string): string {
  return content.replace(LINK_AS_IMAGE_RE, (match, alt, url) => {
    if (isImageUrl(url))
      return `![${alt}](${url})`;
    return match;
  });
}

export function extractFirstImageUrl(content: string): string | undefined {
  const fixed = fixImageLinksInMarkdown(content);

  const imageMatch = fixed.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
  if (imageMatch) {
    const url = imageMatch[1].replace(/^["']|["']$/g, "").trim();
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"))
      return url;
  }

  return undefined;
}
