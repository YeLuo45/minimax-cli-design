# 测试体系

本项目使用 [Bun Test](https://bun.sh/docs/runtime/test) 作为测试框架，配合 Bun 原生运行时实现高效的单元测试与集成测试。

## 目录结构

```
test/
├── args.test.ts              # 参数解析测试
├── auth/
│   ├── credentials.test.ts   # 凭证测试
│   ├── resolver.test.ts      # 凭证解析器测试
│   ├── refresh.test.ts       # Token 刷新测试
│   └── timeout-fix.test.ts   # 超时修复测试
├── client/
│   ├── endpoints.test.ts     # 端点测试
│   ├── http.test.ts          # HTTP 客户端测试
│   └── stream.test.ts        # 流式响应测试
├── commands/
│   ├── aliases.test.ts       # 命令别名测试
│   ├── auth/
│   │   ├── login.test.ts     # 登录测试
│   │   ├── logout.test.ts    # 登出测试
│   │   ├── status.test.ts    # 状态测试
│   │   └── refresh.test.ts   # 刷新测试
│   ├── config/
│   │   ├── set.test.ts       # 配置设置测试
│   │   └── show.test.ts      # 配置展示测试
│   ├── file/
│   │   └── upload.test.ts    # 文件上传测试
│   ├── image/
│   │   └── generate.test.ts  # 图片生成测试
│   ├── music/
│   │   ├── generate.test.ts  # 音乐生成测试
│   │   └── models.test.ts    # 音乐模型测试
│   ├── quota/
│   │   └── show.test.ts      # 配额展示测试
│   ├── search/
│   │   └── query.test.ts     # 搜索查询测试
│   ├── speech/
│   │   └── synthesize.test.ts # 语音合成测试
│   ├── text/
│   │   └── chat.test.ts      # 文本对话测试
│   ├── video/
│   │   ├── download.test.ts  # 视频下载测试
│   │   ├── generate.test.ts  # 视频生成测试
│   │   └── task-get.test.ts  # 视频任务查询测试
│   └── vision/
│       └── describe.test.ts  # 视觉描述测试
├── errors/
│   └── api.test.ts           # API 错误测试
├── output/
│   ├── formatter.test.ts     # 格式化器测试
│   └── quota-table.test.ts   # 配额表格测试
├── sdk/
│   ├── image.test.ts         # 图片 SDK 测试
│   ├── music.test.ts         # 音乐 SDK 测试
│   ├── quota.test.ts         # 配额 SDK 测试
│   ├── speech.test.ts        # 语音 SDK 测试
│   ├── search.test.ts        # 搜索 SDK 测试
│   ├── text.test.ts          # 文本 SDK 测试
│   ├── video.test.ts         # 视频 SDK 测试
│   └── vision.test.ts        # 视觉 SDK 测试
├── utils/
│   └── model-defaults.test.ts # 模型默认值测试
├── version.test.ts           # 版本测试
├── fixtures/                 # 测试固件 JSON
│   ├── error-rate-limit.json        # 限流错误固件
│   ├── oauth-refresh-response.json  # OAuth 刷新响应固件
│   ├── oauth-token-response.json    # OAuth 令牌响应固件
│   ├── quota-response.json          # 配额响应固件
│   ├── text-chat-response.json      # 文本对话响应固件
│   ├── video-task-pending.json      # 视频任务进行中固件
│   └── video-task-success.json      # 视频任务成功固件
└── helpers/
    └── mock-server.ts        # Mock 服务器辅助工具
```

## 运行测试

```bash
# 运行所有测试
bun test

# 监听模式（文件变更时自动重新运行）
bun test --watch

# 运行单个测试文件
bun test test/sdk/text.test.ts

# 运行匹配特定模式的测试
bun test --grep "auth"

# 运行匹配多个模式的测试
bun test --grep "auth login"
```

## 测试组织

测试按功能模块划分：

| 目录 | 说明 |
|------|------|
| `args.test.ts` | 命令行参数解析 |
| `auth/` | 认证与凭证管理 |
| `client/` | HTTP 客户端、端点、流式响应 |
| `commands/` | 各命令的功能测试 |
| `errors/` | API 错误处理 |
| `output/` | 输出格式化 |
| `sdk/` | SDK 功能测试 |
| `utils/` | 工具函数测试 |
| `version.test.ts` | 版本信息测试 |
| `fixtures/` | 测试用的 JSON 固件数据 |
| `helpers/` | 测试辅助工具（如 Mock 服务器） |

## 编写测试

使用 Bun Test API：

```typescript
import { describe, it, expect, mock } from 'bun:test';

describe('auth/login', () => {
  it('should login successfully', async () => {
    expect(true).toBe(true);
  });

  it('should handle invalid credentials', async () => {
    expect(false).toBe(false);
  });
});
```

## Mock 服务器

`test/helpers/mock-server.ts` 提供测试用的 HTTP Mock 服务器，用于模拟 API 响应。

## 测试固件

`test/fixtures/` 目录存放测试用的 JSON 固件文件，包含各类 API 响应的示例数据，供测试时加载使用。
