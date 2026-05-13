# MiniMax CLI 命令参考

`mmx` 是 MiniMax AI 平台的官方 CLI 工具，支持文本对话、图像生成、视频生成、语音合成、音乐生成、图像理解和网络搜索。

## 安装

```bash
npm install -g mmx-cli
```

> 需要 Node.js 18+

---

## 全局参数（Global Flags）

| 参数 | 说明 |
|------|------|
| `--output json\|text` | 输出格式，默认 `text` |
| `--quiet` | 静默模式，不显示进度信息 |
| `--api-key <key>` | 直接传入 API Key（优先级最高） |

---

## 命令速查

| 命令 | 说明 |
|------|------|
| `mmx auth login` | 登录（API Key 或 OAuth） |
| `mmx auth status` | 检查认证状态 |
| `mmx auth refresh` | 刷新 Token |
| `mmx auth logout` | 登出 |
| `mmx config show` | 显示配置 |
| `mmx config set` | 设置配置项 |
| `mmx quota` | 查看配额 |
| `mmx text chat` | 文本对话 |
| `mmx image generate` | 图像生成 |
| `mmx video generate` | 视频生成 |
| `mmx speech synthesize` | 语音合成 |
| `mmx music generate` | 音乐生成 |
| `mmx vision describe` | 图像理解 |
| `mmx search query` | 网络搜索 |
| `mmx update` | 检查更新 |

---

## 认证命令 `mmx auth`

### `mmx auth login`

登录认证，支持 API Key 和 OAuth 两种方式。

```bash
mmx auth login                        # OAuth 浏览器认证
mmx auth login --no-browser           # OAuth 设备码认证（无浏览器时）
mmx auth login --api-key sk-xxxxx    # API Key 登录
```

| 参数 | 说明 |
|------|------|
| `--method <oauth\|api-key>` | 认证方式，默认 `oauth` |
| `--api-key <key>` | API Key（`--method api-key` 时必填） |
| `--no-browser` | 使用设备码流程而非浏览器 |

登录成功后会自动显示当前配额。

### `mmx auth status`

检查当前认证状态。

```bash
mmx auth status
```

### `mmx auth refresh`

刷新 OAuth Access Token。

```bash
mmx auth refresh
```

### `mmx auth logout`

清除本地存储的凭证。

```bash
mmx auth logout
```

---

## 配置命令 `mmx config`

### `mmx config show`

显示当前配置。

```bash
mmx config show
mmx config show --output json
```

输出内容包含：区域、基础 URL、输出格式、超时时间、配置文件路径，以及已保存的 API Key（脱敏显示）和默认模型。

### `mmx config set`

设置配置项。

```bash
mmx config set --key region --value cn
mmx config set --key default-text-model --value MiniMax-M2.7-highspeed
mmx config set --key default-speech-model --value speech-2.8-hd
```

| 参数 | 说明 |
|------|------|
| `--key <name>` | 配置项名称 |
| `--value <val>` | 配置值 |

支持的配置项：`region`（`global` 或 `cn`）、`default-text-model`、`default-speech-model`、`default-video-model`、`default-music-model`。

### `mmx config export-schema`

导出配置 schema（JSON 格式），用于查看所有可配置的字段。

```bash
mmx config export-schema | jq .
```

---

## 配额查询 `mmx quota`

查看当前 Token Plan 的剩余配额。

```bash
mmx quota
mmx quota --output json
```

显示各模型的剩余调用次数。

---

## 文本对话 `mmx text chat`

调用 MiniMax Messages API 进行多轮对话，支持流式输出。

```bash
# 基础对话
mmx text chat --message "什么是 MiniMax？"

# 指定模型 + 系统提示
mmx text chat --model MiniMax-M2.7-highspeed --system "你是一个编程助手" --message "用 Go 写一个斐波那契数列"

# 多轮对话
mmx text chat --message "Hello" --message "assistant:Hi!" --message "How are you?"

# 从文件读取对话历史
cat conversation.json | mmx text chat --messages-file - --stream

# 非流式输出
mmx text chat --message "Hello" --output json
```

| 参数 | 说明 |
|------|------|
| `--model <id>` | 模型 ID，默认 `MiniMax-M2.7` |
| `--message <text>` | 消息内容（可重复，支持 `role:content` 格式指定角色） |
| `--messages-file <path>` | 从 JSON 文件读取消息数组（`-` 表示 stdin） |
| `--system <text>` | 系统提示词 |
| `--max-tokens <n>` | 最大生成 token 数，默认 4096 |
| `--temperature <n>` | 采样温度，范围 (0.0, 1.0] |
| `--top-p <n>` | Nucleus 采样阈值 |
| `--stream` | 启用流式输出（默认在 TTY 模式下自动开启） |
| `--tool <json>` | 工具定义 JSON（可重复） |

**消息格式**：`--message` 支持 `role:content` 前缀指定角色：
- `user:你好` → 用户消息
- `assistant:你好` → 助手消息
- 不带前缀默认为用户消息

---

## 图像生成 `mmx image generate`

使用 `image-01` / `image-01-live` 模型生成图像。

```bash
# 基础生成
mmx image generate --prompt "Mars 上的太空猫"

# 指定宽高比 + 生成数量
mmx image generate --prompt "Logo 设计" --n 3 --aspect-ratio 16:9

# 自定义尺寸（512-2048，必须是 8 的倍数）
mmx image generate --prompt "宽幅风景" --width 1920 --height 1080

# 使用种子保证可复现
mmx image generate --prompt "一座城堡" --seed 42

# 保存到指定路径
mmx image generate --prompt "一只猫" --out /tmp/cat.jpg

# 使用 Base64 响应格式
mmx image generate --prompt "一只猫" --response-format base64

# 提示词优化 + 水印
mmx image generate --prompt "日落" --prompt-optimizer --aigc-watermark

# 主体参考（角色一致性）
mmx image generate --prompt "穿西装的猫" --subject-ref "type=character,image=ref.jpg"
```

| 参数 | 说明 |
|------|------|
| `--prompt <text>` | 图像描述（必填） |
| `--aspect-ratio <ratio>` | 宽高比，如 `16:9`、`1:1` |
| `--n <count>` | 生成数量，默认 1 |
| `--seed <n>` | 随机种子，用于复现相同输出 |
| `--width <px>` | 自定义宽度，范围 [512, 2048]，必须是 8 的倍数 |
| `--height <px>` | 自定义高度，范围 [512, 2048]，必须是 8 的倍数 |
| `--prompt-optimizer` | 自动优化提示词 |
| `--aigc-watermark` | 嵌入 AI 生成内容水印 |
| `--subject-ref <params>` | 主体参考，格式：`type=character,image=path-or-url` |
| `--out <path>` | 保存到指定文件路径（仅单张时使用） |
| `--out-dir <dir>` | 下载到目录 |
| `--out-prefix <prefix>` | 文件名前缀，默认 `image` |
| `--response-format <url\|base64>` | 响应格式，默认 `url` |

---

## 视频生成 `mmx video generate`

视频生成支持多种模式：文生视频（T2V）、图生视频（I2V）、首尾帧插值（SEF）、主体参考（S2V）。

```bash
# 文生视频
mmx video generate --prompt "海浪在日落时分"

# 生成并下载
mmx video generate --prompt "海浪在日落时分" --download ocean.mp4

# 异步模式（不等待，适合 CI/Agent）
mmx video generate --prompt "机器人绘画" --async --quiet

# 图生视频（I2V）
mmx video generate --prompt "一个男人在读书" --first-frame start.jpg

# 图生视频（快速模式）
mmx video generate --prompt "一个男人在读书" --model MiniMax-Hailuo-2.3-Fast --first-frame start.jpg

# 首尾帧插值（SEF）
mmx video generate --prompt "向前走" --first-frame start.jpg --last-frame end.jpg

# 主体参考（角色一致性，S2V）
mmx video generate --prompt "侦探行走" --subject-image character.jpg

# Webhook 回调
mmx video generate --prompt "海浪" --callback-url https://your-webhook.com/callback
```

| 参数 | 说明 |
|------|------|
| `--model <model>` | 模型：`MiniMax-Hailuo-2.3`（默认 T2V/I2V）、`MiniMax-Hailuo-2.3-Fast`（快速 I2V）、`MiniMax-Hailuo-02`（SEF）、`S2V-01`（主体参考） |
| `--prompt <text>` | 视频描述（必填） |
| `--first-frame <path-or-url>` | 首帧图像（图生视频） |
| `--last-frame <path-or-url>` | 尾帧图像（SEF 模式，需配合 `--first-frame`） |
| `--subject-image <path-or-url>` | 主体参考图像（角色一致性，切换到 S2V-01 模型） |
| `--callback-url <url>` | 完成通知的 Webhook URL |
| `--download <path>` | 完成后下载到指定文件 |
| `--no-wait` / `--async` | 立即返回任务 ID，不等待完成 |
| `--poll-interval <seconds>` | 轮询间隔，默认 5 秒 |

**模式说明**：
- **T2V**：纯文本生成视频（`MiniMax-Hailuo-2.3`）
- **I2V**：图片 + 文本生成视频（提供 `--first-frame`）
- **SEF**：首尾帧插值（提供 `--first-frame` + `--last-frame`，自动使用 `MiniMax-Hailuo-02`）
- **S2V**：主体一致性（提供 `--subject-image`，自动使用 `S2V-01`）

### `mmx video task get`

查询视频任务状态。

```bash
mmx video task get --task-id 123456
```

### `mmx video download`

通过 file_id 下载已生成的视频。

```bash
mmx video download --file-id 176844028768320 --out video.mp4
```

---

## 语音合成 `mmx speech synthesize`

文字转语音（TTS），支持 30+ 音色、流速调节、实时流式播放。

```bash
# 基础合成
mmx speech synthesize --text "Hello, world!"

# 保存到文件
mmx speech synthesize --text "Hello, world!" --out hello.mp3

# 指定音色和语速
mmx speech synthesize --text "Hi" --voice English_magnetic_voiced_man --speed 1.2

# 带字幕
mmx speech synthesize --text "Hello" --subtitles --out hello.mp3

# 从文件读取文本
cat article.txt | mmx speech synthesize --text-file - --out audio.mp3

# 实时流式播放
mmx speech synthesize --text "Stream me" --stream | mpv --no-terminal -
```

| 参数 | 说明 |
|------|------|
| `--model <model>` | 模型：`speech-2.8-hd`（默认）、`speech-2.6`、`speech-02` |
| `--text <text>` | 要合成的文本 |
| `--text-file <path>` | 从文件读取文本（`-` 表示 stdin） |
| `--voice <id>` | 音色 ID，默认 `English_expressive_narrator` |
| `--speed <n>` | 语速倍率 |
| `--volume <n>` | 音量 |
| `--pitch <n>` | 音调调整 |
| `--format <fmt>` | 音频格式，默认 `mp3` |
| `--sample-rate <hz>` | 采样率，默认 32000 |
| `--bitrate <bps>` | 比特率，默认 128000 |
| `--channels <n>` | 声道数，默认 1 |
| `--language <code>` | 语言增强 |
| `--subtitles` | 生成字幕文件（.srt） |
| `--pronunciation <from/to>` | 自定义发音（可重复） |
| `--out <path>` | 保存到文件 |
| `--stream` | 流式输出到 stdout |

### `mmx speech voices`

列出所有可用的音色。

```bash
mmx speech voices
```

---

## 音乐生成 `mmx music generate`

文本生成音乐，支持歌词生成、器乐生成、歌词优化等功能。

```bash
# 带歌词生成
mmx music generate --prompt "流行舞曲" --lyrics "[verse] La la la... 阳光明媚" --out song.mp3

# 从文件读取歌词
mmx music generate --prompt "独立民谣，忧郁" --lyrics-file song.txt --out my_song.mp3

# 自动生成歌词
mmx music generate --prompt "关于夏天的流行歌曲" --lyrics-optimizer --out summer.mp3

# 器乐（无人声）
mmx music generate --prompt "电影配乐，管弦乐，张力渐强" --instrumental --out bgm.mp3

# 详细参数
mmx music generate --prompt "温暖的早晨民谣" \
  --vocals "男女人声二重唱，合声在副歌" \
  --instruments "原声吉他，钢琴，弦乐" \
  --bpm 95 \
  --lyrics-file song.txt \
  --out duet.mp3

# 指定模型
mmx music generate --prompt "电子音乐" --model "music-2.5+" --out electronic.mp3

# URL 输出（24 小时有效期，需及时下载）
mmx music generate --prompt "流行音乐" --lyrics "La la la..." --output-format url
```

| 参数 | 说明 |
|------|------|
| `--prompt <text>` | 音乐风格描述（最多 2000 字符） |
| `--lyrics <text>` | 歌词，支持结构标签：`[Intro]`、`[Verse]`、`[Chorus]`、`[Bridge]`、`[Outro]` 等 |
| `--lyrics-file <path>` | 从文件读取歌词（`-` 表示 stdin） |
| `--lyrics-optimizer` | 根据提示词自动生成歌词（与 `--lyrics`/`--instrumental` 互斥） |
| `--instrumental` | 生成器乐（无人声，与 `--lyrics` 互斥） |
| `--vocals <text>` | 人声风格描述，如 "温暖男中音"、"明亮女高音" |
| `--genre <text>` | 音乐风格，如 `folk`、`pop`、`jazz`、`electronic` |
| `--mood <text>` | 情绪，如 `温暖`、`忧郁`、`振奋` |
| `--instruments <text>` | 主要乐器，如 `原声吉他、钢琴、弦乐` |
| `--tempo <text>` | 节奏描述：`fast`、`slow`、`moderate` |
| `--bpm <n>` | 精确 BPM |
| `--key <text>` | 调性，如 `C major`、`A minor` |
| `--avoid <text>` | 避免出现的元素 |
| `--use-case <text>` | 使用场景，如 "视频背景音乐"、"主题曲" |
| `--structure <text>` | 歌曲结构，如 `verse-chorus-verse-bridge-chorus` |
| `--references <text>` | 参考曲目或艺术家 |
| `--extra <text>` | 其他细化要求 |
| `--model <model>` | 模型：`music-2.6`（推荐）、`music-2.6-free`（默认，无限）、`music-2.5+`、`music-2.5` |
| `--output-format <hex\|url>` | 输出格式：`hex`（默认，保存文件）或 `url`（24 小时有效） |
| `--aigc-watermark` | 嵌入 AI 内容水印 |
| `--format <fmt>` | 音频格式，默认 `mp3` |
| `--sample-rate <hz>` | 采样率，默认 44100 |
| `--bitrate <bps>` | 比特率，默认 256000 |
| `--stream` | 流式输出到 stdout |
| `--out <path>` | 保存到文件 |

### `mmx music cover`

基于参考音频生成翻唱版本。

```bash
# 本地文件
mmx music cover --prompt "爵士，钢琴，温暖女声" --audio-file original.mp3 --out cover.mp3

# URL 来源
mmx music cover --prompt "独立民谣" --audio https://example.com/song.mp3 --out cover.mp3
```

| 参数 | 说明 |
|------|------|
| `--prompt <text>` | 翻唱风格描述 |
| `--audio-file <path>` | 参考音频文件（本地路径） |
| `--audio <url>` | 参考音频 URL |
| `--out <path>` | 保存路径 |

### `mmx music models`

列出所有可用的音乐模型。

```bash
mmx music models
```

---

## 图像理解 `mmx vision describe`

使用 MiniMax VLM 模型理解图像内容。

```bash
# 本地图片
mmx vision describe --image photo.jpg

# URL 图片
mmx vision describe --image https://example.com/photo.jpg --prompt "这是什么品种的狗？"

# 使用预上传的 file_id
mmx vision describe --file-id file-123456789 --prompt "提取图片中的文字"

# 简写（位置参数）
mmx vision photo.jpg
```

| 参数 | 说明 |
|------|------|
| `--image <path-or-url>` | 本地图片路径或 URL（自动 Base64 编码） |
| `--file-id <id>` | 预上传的文件 ID（跳过 Base64 编码） |
| `--prompt <text>` | 关于图片的问题，默认 "Describe the image." |

支持的图片格式：`jpg`、`jpeg`、`png`、`webp`。最大 50 MB。

---

## 网络搜索 `mmx search query`

使用 MiniMax 搜索引擎进行网络搜索。

```bash
# 基础搜索
mmx search query --q "MiniMax AI 最新动态"

# JSON 输出
mmx search query --q "最新新闻" --output json

# 静默模式（仅标题和链接）
mmx search query --q "技术博客" --quiet
```

| 参数 | 说明 |
|------|------|
| `--q <query>` | 搜索查询字符串（必填） |

---

## 文件管理 `mmx file`

管理 MiniMax 云存储中的文件。

### `mmx file list`

列出已上传的文件。

```bash
mmx file list
```

### `mmx file upload`

上传文件到云存储。

```bash
mmx file upload --path document.pdf
```

### `mmx file delete`

删除云存储中的文件。

```bash
mmx file delete --file-id file-xxxxx
```

---

## 更新命令 `mmx update`

检查并更新 CLI 到最新版本。

```bash
mmx update           # 检查更新
mmx update latest    # 更新到最新版本
```

---

## 示例：完整工作流

```bash
# 1. 登录
mmx auth login --api-key sk-xxxxx

# 2. 查看配额
mmx quota

# 3. 文本对话
mmx text chat --message "用中文介绍一下 MiniMax"

# 4. 生成图片
mmx image generate --prompt "一只戴着墨镜的猫在海边" --out-dir ./output/

# 5. 图生视频
mmx video generate --prompt "猫在海边散步" --first-frame ./output/image_001.jpg --download cat_beach.mp4

# 6. 语音合成
mmx speech synthesize --text "视频生成完成！" --voice Chinese_male_warm --out notification.mp3

# 7. 生成背景音乐
mmx music generate --prompt "轻松愉悦的咖啡厅背景音乐" --instrumental --out bgm.mp3

# 8. 图像理解
mmx vision describe --image ./output/image_001.jpg --prompt "描述这张图片"

# 9. 网络搜索
mmx search query --q "MiniMax 视频生成模型最新进展"
```

---

## 环境变量

| 变量 | 说明 |
|------|------|
| `MINIMAX_API_KEY` | API Key（会被 `--api-key` 覆盖） |
| `MINIMAX_REGION` | 区域：`global` 或 `cn` |

---

## 配置文件

- **OAuth 凭证**：`~/.mmx/credentials.json`
- **API Key 配置**：`~/.mmx/config.json`
- **CLI 配置目录**：`.mmx/`
