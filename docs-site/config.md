# 配置系统

MiniMax CLI (`mmx`) 配置系统负责管理 CLI 的全局设置、API 凭证和区域信息。

## 目录结构

```
src/config/
├── schema.ts         # 配置 Schema 定义（Zod 风格）
├── loader.ts         # 配置加载逻辑
├── detect-region.ts  # 区域自动检测
└── paths.ts          # 路径常量
```

---

## schema.ts — 配置 Schema

定义配置的数据结构和类型验证。

### 区域定义

```typescript
export const REGIONS = {
  global: 'https://api.minimax.io',
  cn: 'https://api.minimaxi.com',
} as const;

export type Region = keyof typeof REGIONS;
```

| 区域 | API 地址 |
|------|----------|
| `global` | `https://api.minimax.io` |
| `cn` | `https://api.minimaxi.com` |

### 文档主机

```typescript
export const DOCS_HOSTS = {
  global: 'https://platform.minimax.io',
  cn: 'https://platform.minimaxi.com',
} as const;
```

### ConfigFile 接口（持久化配置）

存储在 `~/.mmx/config.json` 中的配置结构：

| 字段 | 类型 | 描述 |
|------|------|------|
| `api_key` | `string?` | API 密钥（可选） |
| `region` | `Region?` | 区域：`'global'` 或 `'cn'` |
| `base_url` | `string?` | 自定义 API 地址 |
| `output` | `'text' \| 'json'?` | 输出格式 |
| `timeout` | `number?` | 请求超时时间（秒） |
| `default_text_model` | `string?` | 默认文本模型 |
| `default_speech_model` | `string?` | 默认语音模型 |
| `default_video_model` | `string?` | 默认视频模型 |
| `default_music_model` | `string?` | 默认音乐模型 |

### Config 接口（运行时配置）

CLI 运行时使用的完整配置对象：

| 字段 | 类型 | 描述 |
|------|------|------|
| `apiKey` | `string?` | 来自命令行 flags 的 API Key |
| `fileApiKey` | `string?` | 来自配置文件的 API Key |
| `fileRegion` | `Region?` | 来自配置文件的区域 |
| `configPath` | `string?` | 配置文件路径 |
| `region` | `Region` | 当前生效的区域 |
| `baseUrl` | `string` | 当前 API 地址 |
| `output` | `'text' \| 'json'` | 输出格式 |
| `timeout` | `number` | 超时时间（秒） |
| `defaultTextModel` | `string?` | 默认文本模型 |
| `defaultSpeechModel` | `string?` | 默认语音模型 |
| `defaultVideoModel` | `string?` | 默认视频模型 |
| `defaultMusicModel` | `string?` | 默认音乐模型 |
| `verbose` | `boolean` | 详细输出模式 |
| `quiet` | `boolean` | 静默模式 |
| `noColor` | `boolean` | 禁用彩色输出 |
| `yes` | `boolean` | 自动确认提示 |
| `dryRun` | `boolean` | 试运行模式 |
| `nonInteractive` | `boolean` | 非交互模式 |
| `async` | `boolean` | 异步模式 |
| `needsRegionDetection` | `boolean?` | 是否需要区域检测 |

### 配置解析

`parseConfigFile(raw: unknown): ConfigFile` 函数负责验证和解析原始配置对象：

- 跳过无效类型或非对象值
- 仅保留符合类型要求的字段
- 对 `region` 和 `output` 进行枚举校验

---

## loader.ts — 配置加载

配置加载遵循优先级顺序：**默认配置 < 用户配置 < 环境变量 < 命令行 flags**

### 加载顺序

```
1. 默认值
   ↓
2. 用户配置文件 (~/.mmx/config.json)
   ↓
3. 环境变量 (MINIMAX_*)
   ↓
4. 命令行 flags
```

### 核心函数

#### `readConfigFile(): ConfigFile`

读取并解析 `~/.mmx/config.json` 配置文件：

- 文件不存在时返回空对象 `{}`
- JSON 解析失败时输出警告，返回空对象
- 配置文件损坏时提示用户运行 `mmx config set` 重置

#### `writeConfigFile(data: Record<string, unknown>): Promise<void>`

写入配置到 `~/.mmx/config.json`：

- 自动确保配置目录存在
- 先写入临时文件再原子性重命名
- 文件权限设置为 `0o600`（仅所有者可读写）

#### `loadConfig(flags: GlobalFlags): Config`

合并所有配置源，返回最终运行时配置：

```typescript
const config = loadConfig(flags);
```

**配置合并逻辑：**

| 配置项 | 优先级（高→低） |
|--------|----------------|
| API Key | `flags.apiKey` > `file.api_key` |
| Region | `flags.region` > `MINIMAX_REGION` > `file.region` > `'global'` |
| Base URL | `flags.baseUrl` > `MINIMAX_BASE_URL` > `file.base_url` > `REGIONS[region]` |
| Output | `flags.output` > `MINIMAX_OUTPUT` > `file.output` |
| Timeout | `flags.timeout` > `MINIMAX_TIMEOUT` > `file.timeout` > `300` |

**区域检测触发条件：**

当满足以下条件时，CLI 会自动检测 API Key 对应的区域：

- 用户未通过 flags 或环境变量明确指定区域
- 配置文件中没有缓存的区域信息
- 用户提供了新的 API Key（与配置文件中的不同）

---

## detect-region.ts — 区域自动检测

通过实际 API 调用探测正确的区域。

### 检测逻辑

```typescript
async function probeRegion(region: Region, apiKey: string, timeoutMs: number): Promise<boolean>
```

1. 向目标区域的 `/v1/token_plan/remains` 端点发送检测请求
2. 同时尝试两种认证方式：
   - `Authorization: Bearer <apiKey>`
   - `x-api-key: <apiKey>`
3. 只要其中一种认证成功（返回 `status_code: 0`），则该区域有效

### 主检测函数

```typescript
export async function detectRegion(apiKey: string): Promise<Region>
```

**检测流程：**

1. 并发向 `global` 和 `cn` 两个区域发送检测请求
2. 超时时间：5000ms
3. 第一个返回成功的区域即为检测结果
4. 所有区域均失败时：
   - 输出警告信息
   - 回退到 `'global'` 区域
   - 提示用户检查 API Key 或网络连接

### 保存检测结果

```typescript
export async function saveDetectedRegion(region: Region): Promise<void>
```

检测成功后，将区域信息写入 `~/.mmx/config.json` 以便后续使用。

---

## paths.ts — 路径常量

定义配置文件和凭证的存储路径。

### 路径定义

```typescript
const CONFIG_DIR_NAME = '.mmx';

export function getConfigDir(): string      // → ~/.mmx/
export function getConfigPath(): string    // → ~/.mmx/config.json
export function getCredentialsPath(): string // → ~/.mmx/credentials.json
export async function ensureConfigDir(): Promise<void>
```

### 目录结构

```
~/.mmx/
├── config.json       # CLI 全局配置
└── credentials.json  # OAuth 凭证（OAuth 流程使用）
```

### 目录权限

`ensureConfigDir()` 创建配置目录时设置权限为 `0o700`（仅所有者可读写），确保凭证安全。

---

## 全局配置命令

### `mmx config show`

显示当前配置信息。

```bash
mmx config show
mmx config show --output json
```

**输出示例：**

```
Region:         global
API Endpoint:   https://api.minimax.io
Output Format:  text
Timeout:        300s
Default Models:
  Text:   -
  Speech: -
  Video:  -
  Music:  -
```

### `mmx config set`

设置配置项。

```bash
mmx config set --key <key> --value <value>
```

**示例：**

```bash
# 设置输出格式
mmx config set --key output --value json

# 设置超时时间
mmx config set --key timeout --value 600

# 设置自定义 API 地址
mmx config set --key base_url --value https://api-uw.minimax.io

# 设置区域
mmx config set --key region --value cn
```

**支持的配置键：**

| 键名 | 值类型 | 描述 |
|------|--------|------|
| `api_key` | `string` | API 密钥 |
| `region` | `global \| cn` | 区域 |
| `base_url` | `string` | 自定义 API 地址 |
| `output` | `text \| json` | 输出格式 |
| `timeout` | `number` | 超时时间（秒） |
| `default_text_model` | `string` | 默认文本模型 |
| `default_speech_model` | `string` | 默认语音模型 |
| `default_video_model` | `string` | 默认视频模型 |
| `default_music_model` | `string` | 默认音乐模型 |

### `mmx config export-schema`

导出配置 Schema（用于工具集成）。

```bash
mmx config export-schema
mmx config export-schema --command "video generate"
```

**用途：**

- 生成 Zod Schema JSON，用于外部工具验证配置
- 可指定命令生成该命令特定的配置 Schema

---

## 环境变量

| 变量名 | 描述 | 对应配置 |
|--------|------|----------|
| `MINIMAX_API_KEY` | API 密钥 | `api_key` |
| `MINIMAX_REGION` | 区域 (`global` 或 `cn`) | `region` |
| `MINIMAX_BASE_URL` | 自定义 API 地址 | `base_url` |
| `MINIMAX_OUTPUT` | 输出格式 (`text` 或 `json`) | `output` |
| `MINIMAX_TIMEOUT` | 超时时间（秒） | `timeout` |
| `MINIMAX_VERBOSE` | 详细输出 (`1` 启用) | `verbose` |

---

## 配置优先级总结

```
命令行 flags
    ↑
环境变量 (MINIMAX_*)
    ↑
用户配置 (~/.mmx/config.json)
    ↑
默认值
```

实际生效的配置 = 默认值 + 用户覆盖的部分（层层合并）
