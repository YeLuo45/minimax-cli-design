import { defineConfig } from "vitepress";

export default defineConfig({
  title: "MiniMax CLI Design",
  description: "mmx-cli 架构设计文档站",
  lang: "zh-CN",
  base: "/minimax-cli-design/",
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
  ],
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "首页", link: "/" },
      { text: "架构", link: "/architecture" },
      { text: "命令参考", link: "/commands" },
      { text: "认证系统", link: "/auth" },
      { text: "SDK", link: "/sdk" },
      { text: "配置", link: "/config" },
      { text: "错误处理", link: "/errors" },
      { text: "测试", link: "/test" },
    ],
    sidebar: [
      {
        text: "文档",
        items: [
          { text: "首页", link: "/" },
          { text: "整体架构", link: "/architecture" },
          { text: "命令参考", link: "/commands" },
          { text: "认证系统", link: "/auth" },
          { text: "SDK", link: "/sdk" },
          { text: "配置系统", link: "/config" },
          { text: "错误处理", link: "/errors" },
          { text: "测试体系", link: "/test" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/YeLuo45/minimax-cli-design" },
    ],
    footer: {
      message: "基于 mmx-cli 源码构建",
      copyright: "Copyright © 2025-present MiniMax",
    },
  },
});
