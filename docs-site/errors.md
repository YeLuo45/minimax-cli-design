# MiniMax CLI 错误处理系统

本文档详细介绍 MiniMax CLI 的错误处理机制、错误分类、错误码定义以及处理策略。

## 目录

- [错误处理架构](#错误处理架构)
- [核心文件](#核心文件)
- [错误分类](#错误分类)
- [错误码详解](#错误码详解)
- [错误处理策略](#错误处理策略)
- [命令级错误参考](#命令级错误参考)

---

## 错误处理架构

MiniMax CLI 采用分层错误处理架构：

```
src/errors/
├── base.ts      # 基础错误类 (CLIError, SDKError)
├── codes.ts     # 退出码定义
├── api.ts       # API 错误映射
└── handler.ts   # 全局错误处理器
```

### 错误类层次

```
Error
└── CLIError          # CLI 基础错误类
    └── SDKError      # SDK 相关错误
```

所有 CLI 错误都继承自 `CLIError` 基类，提供统一的错误信息结构和退出码。

---

## 核心文件

### base.ts — 基础错误类

```typescript
export class CLIError extends Error {
  readonly exitCode: ExitCode;
  readonly hint?: string;

  constructor(message: string, exitCode: ExitCode = ExitCode.GENERAL, hint?: string);
}
```

**关键特性：**
- `exitCode`: 退出码，用于脚本区分错误类型
- `hint`: 可选的提示信息，帮助用户解决问题
- `toJSON()`: 支持 JSON 格式输出（供 `--output json` 使用）

### codes.ts — 退出码定义

| 退出码 | 常量名 | 含义 |
|--------|--------|------|
| 0 | SUCCESS | 成功 |
| 1 | GENERAL | 一般错误 |
| 2 | USAGE | 用法错误（无效参数）|
| 3 | AUTH | 认证错误 |
| 4 | QUOTA | 配额/额度错误 |
| 5 | TIMEOUT | 超时 |
| 6 | NETWORK | 网络错误 |
| 10 | CONTENT_FILTER | 内容过滤 |
| 130 | (信号) | 中断 (Ctrl+C / SIGINT) |

### api.ts — API 错误映射

`mapApiError()` 函数将 API 响应映射为 `CLIError` 实例：

```typescript
export function mapApiError(status: number, body: ApiErrorBody, url?: string): CLIError
```

**API 错误体结构：**
```typescript
interface ApiErrorBody {
  base_resp?: {
    status_code?: number;  // MiniMax 内部状态码
    status_msg?: string;  // 状态消息
  };
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
}
```

### handler.ts — 全局错误处理

`handleError()` 是 CLI 的全局错误处理器，负责：

1. 识别错误类型（CLIError / 标准 Error / 其他）
2. 根据输出格式（text / json）格式化错误输出
3. 设置正确的退出码
4. 在调试模式下输出完整堆栈跟踪

**处理流程：**

```
抛出错误
    ↓
handleError(err)
    ↓
├─ CLIError → 直接使用其 exitCode 和 hint
├─ TimeoutError/AbortError → ExitCode.TIMEOUT
├─ TypeError (fetch failed) → ExitCode.NETWORK
├─ 网络错误 → ExitCode.NETWORK + 代理提示
└─ 文件系统错误 → ExitCode.GENERAL + 权限/路径提示
```

---

## 错误分类

### API Errors — API 返回的错误

由 MiniMax API 返回的错误，通过 `mapApiError()` 处理：

| HTTP 状态码 | 场景 | 退出码 | 提示 |
|-------------|------|--------|------|
| 401 / 403 | Token 无效或过期 | AUTH (3) | `mmx auth status` / `mmx auth login` |
| 408 / 504 | 请求超时 | TIMEOUT (5) | 增加 `--timeout` |
| 429 | 请求频率超限 | QUOTA (4) | `mmx quota show` |

**MiniMax 内部状态码：**

| 状态码 | 含义 | 退出码 |
|--------|------|--------|
| 1002 / 1039 | 内容敏感度过滤器拦截 | CONTENT_FILTER (10) |
| 1028 / 1030 | 配额耗尽 | QUOTA (4) |
| 2061 | 模型不在当前套餐中 | QUOTA (4) |

### Auth Errors — 认证相关错误

| 场景 | 错误消息 |
|------|----------|
| API key 验证失败 | `API key validation failed.` |
| OAuth 回调超时 (120s) | `OAuth callback timed out.` |
| OAuth state 不匹配 | `Invalid OAuth callback.` |
| OAuth token 交换失败 | `OAuth token exchange failed: ${body}` |
| 刷新 token 过期 | `OAuth session expired and could not be refreshed.` |

### Network Errors — 网络错误

| 场景 | 错误消息 | 提示 |
|------|----------|------|
| 网络/连接失败 | `Network request failed.` | 检查网络连接和代理设置 |
| 代理错误 | `Network request failed.` | 检查 HTTP_PROXY / HTTPS_PROXY 环境变量 |
| 请求超时 | `Request timed out.` | 增加 `--timeout` |
| HTTP 408 / 504 | `Request timed out (HTTP ${status}).` | 重试或增加超时 |

**网络错误关键词检测：**
- `failed to fetch`
- `connection refused` / `econnrefused`
- `connection reset` / `econnreset`
- `network error`
- `enotfound` / `getaddrinfo`
- `proxy` / `socket`
- `etimedout` / `timeout`
- `eai_AGAIN`

### File Errors — 文件操作错误

| 错误码 | 场景 | 错误消息 | 提示 |
|--------|------|----------|------|
| ENOENT | 文件不存在 | `File system error: ENOENT: no such file or directory...` | 文件或目录不存在 |
| EACCES / EPERM | 权限不足 | `File system error: EACCES: permission denied...` | 检查文件权限 |
| ENOSPC | 磁盘满 | `File system error: ENOSPC: no space left on device...` | 释放磁盘空间 |
| 其他 | 其他文件系统错误 | `File system error: ${err.message}` | 检查文件路径和权限 |

### Config Errors — 配置错误

| 场景 | 错误消息 |
|------|----------|
| 缺少 `--key` 或 `--value` | `--key and --value are required.` |
| key 不在有效列表 | `Invalid config key "${key}". Valid keys: region, base_url, output, timeout, api_key` |
| region 值无效 | `Invalid region "${value}". Valid values: global, cn` |
| output 值无效 | `Invalid output format "${value}". Valid values: text, json` |
| timeout 不是正数 | `Invalid timeout "${value}". Must be a positive number.` |

---

## 错误码详解

### 常见 HTTP 错误码

| 状态码 | 名称 | 含义 | 处理建议 |
|--------|------|------|----------|
| 401 | Unauthorized | Token 无效或过期 | 重新认证：`mmx auth login` |
| 403 | Forbidden | 权限不足 | 检查 API key 权限 |
| 429 | Rate Limited | 请求频率超限 | 降低请求频率或升级套餐 |
| 500 | Internal Server Error | 服务器内部错误 | 稍后重试 |
| 502 | Bad Gateway | 网关错误 | API 服务可能暂时不可用 |

### 退出码优先级

当多个错误条件同时满足时，`handleError` 按以下优先级处理：

1. **CLIError 实例** — 直接使用其退出码
2. **超时错误** — TIMEOUT (5)
3. **fetch 失败** — NETWORK (6)
4. **网络错误** — NETWORK (6)
5. **文件系统错误** — GENERAL (1)
6. **其他错误** — GENERAL (1)

---

## 错误处理策略

### 优雅降级

CLI 在遇到错误时会尽可能提供有用的信息，而不是直接崩溃：

1. **错误分类** — 根据错误类型提供针对性的解决方案
2. **hint 提示** — 提供下一步操作建议
3. **多格式支持** — 支持 text 和 json 两种输出格式

### 错误提示信息

错误输出格式（text 模式）：

```
Error: <错误消息>

  <hint 提示信息>
  
  (exit code <退出码>)
```

错误输出格式（json 模式）：

```json
{
  "error": {
    "code": <退出码>,
    "message": "<错误消息>",
    "hint": "<提示信息>"  // 可选
  }
}
```

### 调试模式支持

设置 `MINIMAX_VERBOSE=1` 环境变量启用调试模式，会输出完整的错误堆栈跟踪：

```bash
MINIMAX_VERBOSE=1 mmx video generate --prompt "test"
```

### 配置/凭证文件损坏处理

| 文件 | 损坏时的行为 |
|------|-------------|
| `~/.mmx/credentials.json` | 警告写入 stderr；视为无凭证 |
| `~/.mmx/config.json` | 警告写入 stderr；视为空配置 |

---

## 命令级错误参考

详细错误消息按命令分类，参见 [ERRORS.md](https://github.com/MiniMax-iOS-Development/mmx-cli/blob/main/ERRORS.md)。

### 认证命令 (auth)

| 命令 | 错误场景 |
|------|----------|
| `mmx auth login` | `--method api-key` 缺少 `--api-key`、API key 验证失败、OAuth 超时/失败 |
| `mmx auth logout` | 无凭证可清除 |
| `mmx auth refresh` | 非 OAuth 模式、刷新 token 过期 |
| `mmx auth status` | 无凭证、配额请求失败 |

### 文本命令 (text)

| 命令 | 错误场景 |
|------|----------|
| `mmx text chat` | 缺少 `--message`、消息文件不存在/无效、工具定义无效、流中断 |

### 图像命令 (image)

| 命令 | 错误场景 |
|------|----------|
| `mmx image generate` | 缺少 `--prompt`、主题参考图像问题、输出目录无写权限、所有图像被拒绝 |

### 视频命令 (video)

| 命令 | 错误场景 |
|------|----------|
| `mmx video generate` | 缺少 `--prompt`、首帧图像问题、任务失败/未知、无 file_id、无下载链接、轮询超时、下载中断、磁盘满 |
| `mmx video task get` | 缺少 `--task-id` |
| `mmx video download` | 缺少 `--file-id`/`--out`、无下载链接、下载失败、磁盘满 |

### 语音命令 (speech)

| 命令 | 错误场景 |
|------|----------|
| `mmx speech synthesize` | 缺少 `--text`/`--text-file`、文本文件问题、输出路径无权限、磁盘满 |
| `mmx speech voices` | 网络错误 |

### 音乐命令 (music)

| 命令 | 错误场景 |
|------|----------|
| `mmx music generate` | 缺少 `--prompt`/`--lyrics`、歌词文件问题、输出路径无权限、磁盘满 |

### 视觉命令 (vision)

| 命令 | 错误场景 |
|------|----------|
| `mmx vision describe` | 缺少 `--image`/`--file-id`、图像不存在/不支持、远程图像下载失败 |

### 文件命令 (file)

| 命令 | 错误场景 |
|------|----------|
| `mmx file upload` | 文件不存在、API 错误 |
| `mmx file delete` | 缺少 `--file-id` |
| `mmx file list` | 网络错误 |

### 全局错误处理

| 错误类型 | 错误消息 |
|----------|----------|
| 网络错误 | `Network request failed.` + 网络/代理提示 |
| API 错误 | `API error: ${apiMsg} (HTTP ${status})` |
| 文件系统错误 | `File system error: ${err.message}` + 路径/权限提示 |
| 中断 (Ctrl+C) | `Interrupted. Exiting.` (退出码 130) |

---

## 错误处理最佳实践

### 在命令中处理错误

```typescript
async function myCommand(config: Config, flags: GlobalFlags): Promise<void> {
  try {
    await doSomething();
  } catch (error) {
    if (error instanceof CLIError) {
      // CLIError 有明确的 exitCode
      throw error;
    }
    // 其他错误会被 handleError 转换
    handleError(error);
  }
}
```

### 创建自定义错误

```typescript
import { CLIError } from './errors/base';
import { ExitCode } from './errors/codes';

throw new CLIError(
  'Something went wrong',
  ExitCode.GENERAL,
  'Try doing X to resolve this issue.'
);
```

### 检查 API 错误

```typescript
import { mapApiError } from './errors/api';

const response = await fetch('/api endpoint');
if (!response.ok) {
  const body = await response.json();
  throw mapApiError(response.status, body, '/api endpoint');
}
```
