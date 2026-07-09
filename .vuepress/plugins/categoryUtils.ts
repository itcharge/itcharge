import { createHash } from "node:crypto";
import type { PostsCategoryItem } from "vuepress-theme-plume";

/** 目录名 → 中文分类名（与 collections.ts 保持一致） */
export const CATEGORY_LABELS: Record<string, string> = {
  life: "生活",
  cooking: "美食",
  reding: "阅读",
  learn: "学习",
  review: "回顾",
  travel: "旅行",
  tech: "技术",
  server: "服务器",
  ios: "iOS",
  tools: "工具",
  account: "账号",
  "macos-tip": "macOS 技巧",
};

const RE_CATEGORY = /^(?:(\d+)\.)?([\s\S]+)$/;
let sortUuid = 10000;
const sortCache: Record<string, number> = {};

function hashCategoryKey(key: string): string {
  return createHash("md5").update(key).digest("hex").slice(0, 6);
}

export function buildCategoryListFromPath(
  filePathRelative: string,
  collectionDir = "blogs",
): PostsCategoryItem[] {
  if (!filePathRelative.startsWith(`${collectionDir}/`))
    return [];

  const segments = filePathRelative
    .slice(collectionDir.length + 1)
    .split("/")
    .slice(0, -1);

  return segments.map((category, index) => {
    const match = category.match(RE_CATEGORY) || [];
    const name = match[2] ?? category;
    const explicitSort = match[1];

    if (!sortCache[name] && !explicitSort)
      sortCache[name] = sortUuid++;

    return {
      id: hashCategoryKey(segments.slice(0, index + 1).join("-")),
      sort: Number(explicitSort || sortCache[name]),
      name: CATEGORY_LABELS[name] ?? name,
    };
  });
}

/** Plume 分类页链接 */
export function categoryLink(id: string): string {
  return `/blogs/categories/?id=${id}`;
}

export const HOME_CATEGORY_LINKS = {
  agent: "/blogs/",
  ios: categoryLink("5da0c1"),
  server: categoryLink("14bb1b"),
  tools: categoryLink("4a9315"),
  life: categoryLink("e155e1"),
  tech: categoryLink("d9f913"),
} as const;
