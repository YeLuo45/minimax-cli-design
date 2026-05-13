# MiniMax CLI Design

> mmx-cli 架构设计文档站

## 项目简介

mmx-cli 是 MiniMax AI 开放平台的官方命令行工具，专为 AI Agent 打造。支持文本对话、图像生成、视频生成、语音合成、音乐生成、图像理解、网络搜索等能力。

**安装**：`npm install -g mmx-cli`

## 文档结构

- [整体架构](./docs-site/architecture.md) — Node.js ESM CLI，模块化命令注册表
- [命令参考](./docs-site/commands.md) — mmx text/image/video/speech/music/vision/search
- [认证系统](./docs-site/auth.md) — OAuth + API Key 双模式，自动 Token 刷新
- [SDK](./docs-site/sdk.md) — 9 个 SDK 模块（Bun Test 覆盖）
- [配置系统](./docs-site/config.md) — Zod Schema 验证，双区域自动切换
- [错误处理](./docs-site/errors.md) — 自定义错误层级，API Error Codes
- [测试体系](./docs-site/test.md) — Bun Test，覆盖 auth/sdk/output/commands

## 在线访问

https://yeluo45.github.io/minimax-cli-design/

## 技术栈

- VitePress — 文档渲染
- GitHub Actions — 自动构建部署
- GitHub Pages — 托管
