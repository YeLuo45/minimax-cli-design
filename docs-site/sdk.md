# SDK 模块

MiniMax CLI 提供了一套统一的 SDK 模块，方便在 Node.js 代码中调用 MiniMax API。

## 概述

SDK 位于 `src/sdk/` 目录，入口文件为 `src/sdk/index.ts`，通过 `MiniMaxSDK` 类统一导出所有子模块。

```typescript
import { MiniMaxSDK } from './sdk';

const sdk = new MiniMaxSDK({ apiKey: 'your-api-key' });
const response = await sdk.text.chat({ messages: [{ role: 'user', content: 'Hello' }] });
```

## 核心类型

### MiniMaxSDKOptions

```typescript
interface MiniMaxSDKOptions {
  apiKey?: string;
  baseUrl?: string;
  region?: Region;
}
```

### ModelPartial&lt;T&gt;

```typescript
type ModelPartial<T> = 'model' extends keyof T
  ? Omit<T, 'model'> & { model?: T['model'] }
  : T;
```

允许在请求时可选指定 `model` 字段，若不指定则使用各模块的默认值。

---

## SDK 模块一览

| 模块 | 类名 | 说明 |
|------|------|------|
| text | `TextSDK` | 文本对话（chat 接口） |
| image | `ImageSDK` | 图像生成 |
| video | `VideoSDK` | 视频生成 |
| speech | `SpeechSDK` | 语音合成 |
| music | `MusicSDK` | 音乐生成 |
| vision | `VisionSDK` | 图像理解 |
| search | `SearchSDK` | 搜索 |
| quota | `QuotaSDK` | 配额查询 |
| client | `Client` | 底层 HTTP 客户端基类 |

---

## Client（客户端基类）

`src/sdk/client.ts`

`Client` 是所有 SDK 模块的基类，负责配置加载和 HTTP 请求封装。

```typescript
export class Client {
  protected config: Config;

  constructor(options: MiniMaxSDKOptions) { ... }

  protected request(opts: RequestOpts): Promise<Response> { ... }
  protected requestJson<T>(opts: RequestOpts): Promise<T> { ... }
}
```

子类通过 `this.request()` 发起原始 HTTP 请求，通过 `this.requestJson<T>()` 发起 JSON 请求并自动解析响应。

---

## TextSDK（文本对话）

`src/sdk/text/index.ts`

提供文本对话能力，支持普通调用和流式输出。

```typescript
export class TextSDK extends Client {
  // 普通调用
  async chat(request: Partial<ChatRequest>): Promise<ChatResponse>;

  // 流式调用
  async chat(request: Partial<ChatRequest> & { stream: true }): Promise<AsyncGenerator<StreamEvent>>;
}
```

**示例：**

```typescript
// 普通调用
const response = await sdk.text.chat({
  messages: [{ role: 'user', content: 'Hello' }],
});

// 流式调用
for await (const event of sdk.text.chat({ messages: [...], stream: true })) {
  console.log(event);
}
```

**默认模型：** `MiniMax-M2.7`
**默认 max_tokens：** `4096`

---

## ImageSDK（图像生成）

`src/sdk/image/index.ts`

```typescript
export class ImageSDK extends Client {
  async generate(request: ModelPartial<ImageRequest>): Promise<ImageResponse>;
}
```

**参数校验：**

- `width` 和 `height` 必须同时提供，范围 512~2048，必须是 8 的倍数
- 也可通过 `aspect_ratio` 指定宽高比

**默认模型：** `image-01`

---

## VideoSDK（视频生成）

`src/sdk/video/index.ts`

```typescript
export class VideoSDK extends Client {
  // 普通生成（同步等待完成）
  async generate(request: ModelPartial<VideoAsyncGenerateRequest>): Promise<VideoResponse>;

  // 异步生成（立即返回 taskId）
  async generate(request: VideoAsyncGenerateRequest & { async: true }): Promise<{taskId: string}>;

  // 查询任务状态
  async getTask({ taskId }: { taskId: string }): Promise<VideoTaskResponse>;

  // 下载视频
  async download(request: VideoDownloadRequest): Promise<{ size: number; save: string; downloadUrl: string }>;
}
```

**VideoAsyncGenerateRequest 扩展字段：**

```typescript
interface VideoAsyncGenerateRequest extends ModelPartial<VideoRequest> {
  async?: boolean;       // 是否异步提交，默认 false
  pollInterval?: number;  // 轮询间隔（秒），默认 5
  timeout?: number;       // 超时时间（秒），默认使用全局配置
}
```

**VideoDownloadRequest：**

```typescript
interface VideoDownloadRequest {
  fileId: string;   // 文件 ID
  outPath: string;  // 保存路径
}
```

**模型自动选择逻辑：**

| 条件 | 默认模型 |
|------|----------|
| 提供 `last_frame_image` | `MiniMax-Hailuo-02` |
| 提供 `subject_reference` | `S2V-01` |
| 其他情况 | `MiniMax-Hailuo-2.3` |

**注意：** `MiniMax-Hailuo-2.3-Fast` 仅支持 I2V（需要提供 `first_frame_image`）。

---

## SpeechSDK（语音合成）

`src/sdk/speech/index.ts`

```typescript
export class SpeechSDK extends Client {
  // 普通合成
  async synthesize(request: ModelPartial<SpeechRequest>): Promise<SpeechResponse>;

  // 流式合成
  async synthesize(request: ModelPartial<SpeechRequest> & { stream: true }): Promise<AsyncGenerator<SpeechResponse>>;

  // 获取可用音色列表
  async voices(language?: string): Promise<SystemVoice[]>;
}
```

**示例：**

```typescript
// 普通合成
const audio = await sdk.speech.synthesize({ text: 'Hello, world!' });

// 获取英文音色
const voices = await sdk.speech.voices('en-US');
```

**默认模型：** `speech-2.8-hd`
**默认音色：** `English_expressive_narrator`
**默认输出格式：** `hex`（十六进制音频数据）

---

## MusicSDK（音乐生成）

`src/sdk/music/index.ts`

```typescript
export class MusicSDK extends Client {
  // 普通生成
  async generate(request: ModelPartial<MusicGenerateRequest>): Promise<MusicResponse>;

  // 流式生成
  async generate(request: ModelPartial<MusicGenerateRequest> & { stream: true }): Promise<AsyncGenerator<Uint8Array<ArrayBuffer>>>;
}
```

**MusicGenerateRequest 扩展字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `vocals` | `string` | 人声风格，如 "warm male baritone" |
| `genre` | `string` | 音乐风格，如 folk, pop, jazz |
| `mood` | `string` | 情绪，如 warm, melancholic, uplifting |
| `instruments` | `string` | 乐器，如 "acoustic guitar, piano" |
| `tempo` | `string` | 节奏描述，如 fast, slow |
| `bpm` | `number` | 精确 BPM |
| `key` | `string` | 调性，如 C major |
| `avoid` | `string` | 避免元素 |
| `use_case` | `string` | 使用场景 |
| `structure` | `string` | 歌曲结构 |
| `references` | `string` | 参考艺术家 |
| `extra` | `string` | 其他细粒度要求 |
| `instrumental` | `boolean` | 纯器乐（无 vocals） |
| `useCase` | `string` | 使用场景（同 use_case） |

**校验规则：**

- `is_instrumental` 和 `lyrics` 不可同时使用
- `lyrics_optimizer` 不可与 `lyrics` 或 `is_instrumental` 同时使用
- 至少需要提供 `prompt`、`lyrics`、`is_instrumental` 或 `lyrics_optimizer` 之一

**有效模型：** `music-2.6`, `music-2.6-free`, `music-2.5+`, `music-2.5`
**有效输出格式：** `hex`, `url`
**流式输出限制：** 流式时 `output_format` 必须为 `hex`

---

## VisionSDK（图像理解）

`src/sdk/vision/index.ts`

```typescript
export interface VlmResponse {
  content: string;
}

export interface ImageDescribeRequest {
  prompt?: string;  // 描述指令，默认 "Describe the image."
  image: string;   // 图片路径或 URL
}

export class VisionSDK extends Client {
  async describe(request: ImageDescribeRequest): Promise<VlmResponse>;
}
```

**示例：**

```typescript
const result = await sdk.vision.describe({
  image: '/path/to/image.jpg',
  prompt: 'Describe this image in detail.',
});
console.log(result.content);
```

---

## SearchSDK（搜索）

`src/sdk/search/index.ts`

```typescript
export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  date: string;
}

export interface SearchResponse {
  organic: SearchResult[];
}

export class SearchSDK extends Client {
  async query(query: string): Promise<SearchResponse>;
}
```

**示例：**

```typescript
const results = await sdk.search.query('MiniMax AI');
console.log(results.organic);
```

---

## QuotaSDK（配额查询）

`src/sdk/quota/index.ts`

```typescript
export class QuotaSDK extends Client {
  async info(): Promise<QuotaResponse>;
}
```

**示例：**

```typescript
const quota = await sdk.quota.info();
console.log(`已用: ${quota.used}, 总额: ${quota.total}`);
```

---

## 测试覆盖

测试文件位于 `test/sdk/`，使用 Bun 测试框架。

| 测试文件 | 覆盖模块 |
|----------|----------|
| `text.test.ts` | TextSDK |
| `image.test.ts` | ImageSDK |
| `video.test.ts` | VideoSDK |
| `speech.test.ts` | SpeechSDK |
| `music.test.ts` | MusicSDK |
| `vision.test.ts` | VisionSDK |
| `search.test.ts` | SearchSDK |
| `quota.test.ts` | QuotaSDK |

运行测试：

```bash
bun test test/sdk/
```

---

## 完整使用示例

```typescript
import { MiniMaxSDK } from './sdk';

const sdk = new MiniMaxSDK({
  apiKey: process.env.MINIMAX_API_KEY,
  region: 'cn',  // 或 'en'
});

// 文本对话
const chat = await sdk.text.chat({
  messages: [{ role: 'user', content: '你好' }],
});

// 图像生成
const image = await sdk.image.generate({ prompt: 'A sunset over mountains' });

// 视频生成（异步）
const { taskId } = await sdk.video.generate({ prompt: 'A cat playing piano', async: true });

// 语音合成
const audio = await sdk.speech.synthesize({ text: 'Hello world' });

// 音乐生成
const music = await sdk.music.generate({ prompt: 'Upbeat pop song' });

// 图像理解
const description = await sdk.vision.describe({ image: '/path/to/image.jpg' });

// 搜索
const searchResults = await sdk.search.query('AI video generation');

// 配额查询
const quota = await sdk.quota.info();
```
