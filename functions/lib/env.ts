export interface Env {
  // D1 数据库绑定（在 Cloudflare 控制台 / wrangler.toml 中配置，binding 名必须叫 DB）
  DB: D1Database;

  // 登录密码相关
  SITE_PASSWORD: string; // 明文密码，仅用于登录校验，存在 secret 里
  SESSION_SECRET: string; // 用于签名 cookie 的随机字符串（跟密码分开，避免改密码后所有会话失效之外还泄露密码本身）

  // 默认使用的模型 Provider：deepseek | claude | openai
  DEFAULT_PROVIDER: string;

  // 各 Provider 的 API Key（只在后台配置，前端永远拿不到）
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_MODEL?: string; // 例如 deepseek-chat

  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string; // 例如 claude-sonnet-5

  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string; // 例如 gpt-5.4，走 Responses API + web_search
}