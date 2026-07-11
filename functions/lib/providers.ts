import type { Env } from "./env";

export interface GenerateResult {
  content: string;
  provider: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
}

export type Provider = "deepseek" | "claude" | "openai" | "minimax";

/**
 * 统一入口：根据 provider 分发到对应的实现。
 *
 * 各家目前的能力差异（写在这里方便以后回来对照，不要凭印象改）：
 * - claude：唯一接了「联网搜索」工具（Anthropic 官方 web_search server tool）的分支。
 *   四个 skill 里大量依赖"抓取最新股价/财报/新闻"，只有这个分支能真正做到数据实时，
 *   其余三家目前都是纯模型知识问答，不联网。
 * - deepseek（默认）：deepseek-chat，走标准 OpenAI 兼容 Chat Completions，没有内置联网能力，
 *   优点是便宜、中文效果不错，缺点是财务数据可能是训练数据里的旧值，报告里模型也会按
 *   prompt.ts 里的运行环境说明主动标注"数据来源：模型知识，可能非最新"。
 * - openai：走的是普通 Chat Completions，同样没有接联网搜索。如果想要 OpenAI 的联网能力，
 *   需要改成 Responses API 的 web_search 工具，字段格式随官方迭代较快，接入前请对照你
 *   要用的模型当时的最新文档核实一遍，不要直接照抄这里的注释。
 * - minimax：走 MiniMax 官方 OpenAI 兼容端点（https://api.minimax.io/v1/chat/completions），
 *   同样没有内置联网搜索。注意 MiniMax 按量付费的 API Key 和"Coding Plan 订阅"用的是两套
 *   不同的额度体系，充值/额度不通用，充错了钱不会自动跑到 API Key 那边。
 */
export async function generateReport(
  provider: Provider,
  prompt: string,
  env: Env
): Promise<GenerateResult> {
  switch (provider) {
    case "deepseek":
      return callDeepSeek(prompt, env);
    case "claude":
      return callClaude(prompt, env);
    case "openai":
      return callOpenAI(prompt, env);
    case "minimax":
      return callMiniMax(prompt, env);
    default:
      throw new Error(`未知的 provider: ${provider}`);
  }
}

// ---------- DeepSeek（默认，OpenAI 兼容接口，无联网） ----------
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

// ---------- Claude (Anthropic Messages API，唯一带联网搜索的分支) ----------
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

// ---------- OpenAI (Chat Completions，无联网) ----------
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

// ---------- MiniMax（OpenAI 兼容接口，无联网） ----------
async function callMiniMax(prompt: string, env: Env): Promise<GenerateResult> {
  if (!env.MINIMAX_API_KEY) throw new Error("未配置 MINIMAX_API_KEY");
  const model = env.MINIMAX_MODEL || "MiniMax-M2.1";

  const res = await fetch("https://api.minimax.io/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.MINIMAX_API_KEY}`
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`MiniMax API 错误 (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as any;
  const content = data.choices?.[0]?.message?.content ?? "";

  return {
    content,
    provider: "minimax",
    model,
    tokensInput: data.usage?.prompt_tokens ?? 0,
    tokensOutput: data.usage?.completion_tokens ?? 0
  };
}
