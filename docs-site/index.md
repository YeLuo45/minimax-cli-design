---
layout: home

hero:
  name: "MiniMax CLI Design"
  text: "MiniMax AI 命令行工具架构文档"
  tagline: "基于 mmx-cli 源码架构设计"
  actions:
    - theme: brand
      text: 架构分析
      link: /architecture
    - theme: brand
      text: 命令参考
      link: /commands

features:
  - icon: 🏗️
    title: 整体架构
    details: Node.js ESM CLI，模块化命令注册表，Zod 配置验证
    link: /architecture
    linkText: 查看
  - icon: 💬
    title: 命令系统
    details: mmx text/image/video/speech/music/vision/search 全覆盖
    link: /commands
    linkText: 查看
  - icon: 🔐
    title: 认证系统
    details: OAuth + API Key 双模式，自动 Token 刷新
    link: /auth
    linkText: 查看
  - icon: 🛠️
    title: SDK 与 HTTP
    details: Bun 原生 HTTP 客户端，智能轮询，流式响应
    link: /sdk
    linkText: 查看
  - icon: ⚙️
    title: 配置系统
    details: Zod Schema 验证，双区域自动切换，环境变量支持
    link: /config
    linkText: 查看
  - icon: 🚨
    title: 错误处理
    details: 自定义错误层级，API Error Codes，优雅降级
    link: /errors
    linkText: 查看
  - icon: 🧪
    title: 测试体系
    details: Bun Test 驱动，覆盖 auth/sdk/output/commands
    link: /test
    linkText: 查看
---

## 安装

```bash
npm install -g mmx-cli
npx skills add MiniMax-AI/cli -y -g
```

## 项目概述

**mmx-cli** 是 MiniMax AI Platform 的官方命令行工具，为 AI 智能体和终端用户提供统一的 AI 能力接口。

### 核心能力

- **Text** — 多轮对话、流式输出、系统提示词、JSON 输出
- **Image** — 文生图，比例和批量控制
- **Video** — 异步视频生成，进度追踪
- **Speech** — TTS，30+ 音色，语速调节，流式播放
- **Music** — 文生音乐，歌词，器乐，Cover 生成
- **Vision** — 图像理解
- **Search** — 网络搜索
- **Dual Region** — 全球/国内自动切换

### 技术规格

| 项目 | 值 |
|------|-----|
| npm 包 | `mmx-cli` |
| 许可证 | MIT |
| Node.js | 18+ |
| Global API | `api.minimax.io` |
| CN API | `api.minimaxi.com` |
