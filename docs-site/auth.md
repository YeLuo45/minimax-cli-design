# 认证系统

CLI 支持两种认证方式：**API Key** 和 **OAuth**，凭证按优先级自动解析。

## 认证方式

### 1. API Key 登录

直接传入 API Key，写入 `~/.mmx/config.json`。

```bash
mmx auth login --api-key sk-xxxxx
```

### 2. OAuth 登录

浏览器授权流程，写入 `~/.mmx/credentials.json`。支持两种模式：

- **浏览器授权流程**：打开浏览器完成授权，适用于桌面环境
- **设备码流程**：显示验证码，适用于无浏览器环境（SSH/远程服务器）

```bash
mmx auth login        # 交互式引导
mmx auth login --oauth
```

## 凭证优先级（resolver）

`resolveCredential()` 按以下顺序查找凭证：

1. 命令行 `--api-key` 参数
2. OAuth 凭证 `~/.mmx/credentials.json`（自动刷新 Token）
3. 配置文件 `~/.mmx/config.json` 中的 API Key

优先级逻辑见 `src/auth/resolver.ts`：

```typescript
async function resolveCredential(config: Config): Promise<ResolvedCredential> {
  // 1. --api-key flag
  if (config.apiKey) {
    return { token: config.apiKey, method: 'api-key', source: 'flag' };
  }

  // 2. OAuth credentials file
  const oauth = await loadCredentials();
  if (oauth) {
    const token = await ensureFreshToken(oauth);
    return { token, method: 'oauth', source: 'credentials.json' };
  }

  // 3. API key from config file
  if (config.fileApiKey) {
    return { token: config.fileApiKey, method: 'api-key', source: 'config.json' };
  }

  throw new CLIError('No credentials found.');
}
```

## 核心文件

| 文件 | 说明 |
|------|------|
| `types.ts` | 认证类型定义：`AuthMethod`、`OAuthTokens`、`CredentialFile`、`ResolvedCredential` |
| `credentials.ts` | 凭证读写：加载/保存/清除 `credentials.json`，校验文件权限（要求 600） |
| `oauth.ts` | OAuth 2.0 授权流程：浏览器授权 + PKCE、设备码流程 |
| `refresh.ts` | Token 自动刷新：`refreshAccessToken()` + `ensureFreshToken()` |
| `resolver.ts` | 凭证解析优先级实现 |
| `setup.ts` | 交互式登录引导：检测环境变量提示保存、命令行输入 API Key |

## Token 管理

### 数据结构

```typescript
// OAuth Token（服务器返回）
interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;      // 秒
  token_type: 'Bearer';
}

// 持久化凭证（写入 credentials.json）
interface CredentialFile {
  access_token: string;
  refresh_token: string;
  expires_at: string;      // ISO 8601
  token_type: 'Bearer';
  account?: string;
}
```

### 自动刷新机制

`ensureFreshToken()` 在 Token 过期前 5 分钟自动刷新：

```typescript
async function ensureFreshToken(creds: CredentialFile): Promise<string> {
  const expiresAt = new Date(creds.expires_at).getTime();
  const bufferMs = 5 * 60 * 1000; // 5 minutes buffer

  if (Date.now() < expiresAt - bufferMs) {
    return creds.access_token;  // 无需刷新
  }

  // Token 过期或即将过期 — 刷新
  const tokens = await refreshAccessToken(creds.refresh_token);

  const updated: CredentialFile = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    token_type: 'Bearer',
    account: creds.account,
  };

  await saveCredentials(updated);
  return updated.access_token;
}
```

### 刷新重试策略

- 最多重试 2 次（指数退避：500ms × attempt）
- 4xx 错误直接抛出（不可恢复，需重新登录）
- 5xx 错误触发重试
- 超时时间：10 秒

```typescript
const MAX_REFRESH_RETRIES = 2;
const RETRY_DELAY_MS = 500;
```

## OAuth 流程详解

### 浏览器授权（PKCE）

1. 生成 `code_verifier`（32 字节随机 base64url）和 `code_challenge`（SHA256）
2. 打开浏览器跳转授权页，带 PKCE 参数
3. 本地启动 HTTP 服务器（端口 18991）监听回调
4. 授权成功后换取 Access Token + Refresh Token

### 设备码流程

适用于无浏览器环境（SSH/远程服务器）：

1. 请求设备码，获取 `device_code`、`user_code`、`verification_uri`
2. 显示验证码和验证地址，提示用户访问
3. 轮询 Token 端点，直到用户完成授权
4. 支持 `slow_down` 错误自动延长轮询间隔

## 关键路径

| 路径 | 用途 | 权限 |
|------|------|------|
| `~/.mmx/config.json` | API Key 配置 | 0600 |
| `~/.mmx/credentials.json` | OAuth 凭证 | 0600 |

凭证文件权限要求为 600（仅所有者可读写），否则会输出警告。

## 错误处理

| 错误场景 | 处理方式 |
|----------|----------|
| credentials.json 损坏 | 输出警告，建议 `mmx auth logout` 重置 |
| Token 刷新超时（10s） | 重试，最多重试 2 次 |
| OAuth session 过期 | 抛出 `ExitCode.AUTH`，提示重新登录 |
| 无凭证 | 抛出 `ExitCode.AUTH`，提示 `mmx auth login` |
