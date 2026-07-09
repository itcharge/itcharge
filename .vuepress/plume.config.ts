import { defineThemeConfig } from "vuepress-theme-plume";
import collections from "./collections";
import navbar from "./navbar";

export default defineThemeConfig({
  logo: "/logo.png",
  home: "/",
  profile: {
    avatar: "/head.png",
    name: "ITCharge",
    description: "高效率编程，慢节奏生活",
    circle: true,
    location: "中国，北京",
    layout: "right",
  },
  social: [
    { icon: "github", link: "https://github.com/itcharge" },
    { icon: "gmail", link: "mailto:i@itcharge.cn", ariaLabel: "i@itcharge.cn" },
  ],
  navbar,
  collections,
  footer: {
    message: "高效率编程，慢节奏生活",
    copyright: "Copyright © 2026 ITCharge",
  },
});
