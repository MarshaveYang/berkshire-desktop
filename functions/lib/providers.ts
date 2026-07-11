import type { Env } from "./env";

export interface GenerateResult {
  content: string;
  provider: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
}

export type Provider = "claude" | "openai" | "deepseek";

/**
 * 统一入口：根据 provider 分发到对应的实现。
 * 注意：不同 Provider 的具体接口字段可能随时间变化，接入前请对照官方最新文档核实一遍，
 * 这里给出的是可运行的基础版本。
 */
export async function generateReport(
  provider: Provider,
  prompt: string,
  env: Env
): Promise<GenerateResult> {
  switch (provider) {
    case "claude":
      return callClaude(prompt, env);
    case "openai":
      return callOpenAI(prompt, env);
    case "deepseek":
      return callDeepSeek(prompt, env);
    default:
      throw new Error(`未知的 provider: ${provider}`);
  }
}

// ---------- Claude (Anthropic Messages API) ----------
async function callClaude(prompt: string, env: Env): Promise<GenerateResult> {
  if (!env.ANTHROPIC_API_KEY) throw new Error("未配置 ANTHROPIC_API_KEY");
  const model = env.ANTHROPIC_MODEL || "claude-sonnet-5";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search"
        }
      ]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API 错误 (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as any;
  const content = (data.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n\n");

  return {
    content,
    provider: "claude",
    model,
    tokensInput: data.usage?.input_tokens ?? 0,
    tokensOutput: data.usage?.output_tokens ?? 0
  };
}

// ---------- OpenAI (Chat Completions) ----------
async function callOpenAI(prompt: string, env: Env): Promise<GenerateResult> {
  if (!env.OPENAI_API_KEY) throw new Error("未配置 OPENAI_API_KEY");
  const model = env.OPENAI_MODEL || "gpt-5.1";

  // 说明：如果要开启 OpenAI 侧的联网搜索，需要用 Responses API 的 web_search 工具，
  // 字段格式请以你接入时的官方文档为准，这里先给出不带搜索的基础实现。
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API 错误 (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as any;
  const content = data.choices?.[0]?.message?.content ?? "";

  return {
    content,
    provider: "openai",
    model,
    tokensInput: data.usage?.prompt_tokens ?? 0,
    tokensOutput: data.usage?.completion_tokens ?? 0
  };
}

// ---------- DeepSeek (OpenAI 兼容接口) ----------
async function callDeepSeek(prompt: string, env: Env): Promise<GenerateResult> {
  if (!env.DEEPSEEK_API_KEY) throw new Error("未配置 DEEPSEEK_API_KEY");
  const model = env.DEEPSEEK_MODEL || "deepseek-chat";

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek API 错误 (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as any;
  const content = data.choices?.[0]?.message?.content ?? "";

  return {
    content,
    provider: "deepseek",
    model,
    tokensInput: data.usage?.prompt_tokens ?? 0,
    tokensOutput: data.usage?.completion_tokens ?? 0
  };
}
