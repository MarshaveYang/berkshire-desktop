import type { Env } from "./env";

export interface GenerateResult {
  content: string;
  provider: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
}

export type Provider = "deepseek" | "claude" | "openai";

/**
 * 统一入口：根据 provider 分发到对应的实现。
 *
 * 各家目前的能力差异（写在这里方便以后回来对照，不要凭印象改）：
 * - deepseek（默认）：deepseek-chat，走标准 OpenAI 兼容 Chat Completions，没有内置联网能力，
 *   优点是便宜、中文效果不错，缺点是财务数据可能是训练数据里的旧值，报告里模型也会按
 *   prompt.ts 里的运行环境说明主动标注"数据来源：模型知识，可能非最新"。
 * - claude：接的是 Anthropic 官方 web_search 工具（Messages API 的 server tool）。
 * - openai：接的是官方 Responses API 的 web_search 工具（不是 Chat Completions，
 *   Chat Completions 没法直接用 OpenAI 托管的联网搜索，得自己接第三方搜索源）。
 *   需要 gpt-5.4 / gpt-5.5 这类支持 Responses API 工具调用的模型，普通 API Key 即可，
 *   不需要额外申请权限。max_output_tokens 给太小会出现 status: "incomplete"（没答完但
 *   仍然计费），所以这里给到 8192。
 *
 * 目前 claude 和 openai 都是真联网，deepseek 是纯模型知识问答。
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

// ---------- Claude (Anthropic Messages API + web_search 工具) ----------
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

// ---------- OpenAI (Responses API + web_search 工具) ----------
async function callOpenAI(prompt: string, env: Env): Promise<GenerateResult> {
  if (!env.OPENAI_API_KEY) throw new Error("未配置 OPENAI_API_KEY");
  const model = env.OPENAI_MODEL || "gpt-5.4";

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      input: prompt,
      tools: [{ type: "web_search" }],
      max_output_tokens: 8192
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API 错误 (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as any;

  // status: "incomplete" 说明 max_output_tokens 给的不够、模型没答完，
  // 但这次调用照样计费，所以要显式报错而不是把半截内容当正常结果返回。
  if (data.status === "incomplete") {
    const reason = data.incomplete_details?.reason ?? "未知原因";
    throw new Error(`OpenAI 响应未完成（${reason}），可能是 max_output_tokens 不够`);
  }

  // 优先用 SDK 同款的 output_text 聚合字段；万一没有就手动从 output 数组里捞 message 文本兜底。
  const content: string =
    data.output_text ??
    (data.output || [])
      .filter((item: any) => item.type === "message")
      .flatMap((item: any) => item.content || [])
      .filter((c: any) => c.type === "output_text")
      .map((c: any) => c.text)
      .join("\n\n");

  return {
    content,
    provider: "openai",
    model,
    tokensInput: data.usage?.input_tokens ?? 0,
    tokensOutput: data.usage?.output_tokens ?? 0
  };
}
