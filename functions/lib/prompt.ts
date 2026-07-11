import type { SkillDef } from "./skills-data";

// 原始 skill 文件是给 Claude Code 用的 slash command：
//   1. 用 $ARGUMENTS 占位符接收参数
//   2. 依赖 Task 工具启动多个后台子 Agent 并行研究
//   3. 最后要求"写入文件到 ~/xxx.md"
// 我们跑在普通的 Messages/Chat API 上，没有 Task 工具、也没有本地文件系统，
// 所以这里做两件事：替换参数 + 追加“运行环境说明”，让模型把子 Agent 并行的逻辑
// 收敛成一次性的、结构化的单轮输出。

const RUNTIME_NOTE = `
---
## 运行环境说明（重要，请遵守）

你现在运行在一个网页应用的后端，**不是** Claude Code CLI 环境：
- 你没有 Task 工具，无法真的启动并行子 Agent。请把原本"启动多个 Agent 并行研究"的步骤，
  理解为"在同一次回答中，依次、完整地覆盖这些视角/维度"，不要说"正在启动 Agent"之类的话。
- 你没有本地文件系统，不要提及"写入文件到 ~/xxx.md"，直接把完整报告作为你的回答正文输出即可。
- 如果你拥有联网搜索能力，请优先使用它获取真实、最新的数据（股价、财报、新闻），
  并在关键数据后标注来源和时间；如果没有联网能力或搜索无结果，必须明确标注"数据来源：模型知识，可能非最新，请自行核实"，
  不要编造具体数字。
- 输出必须是纯 Markdown，不要使用 HTML，不要输出与报告无关的寒暄或前后缀。
---
`;

export function buildPrompt(skill: SkillDef, args: string): string {
  const filled = skill.promptTemplate.replaceAll("$ARGUMENTS", args.trim());
  return `${filled}\n${RUNTIME_NOTE}`;
}

export function buildReportTitle(skill: SkillDef, args: string): string {
  return `${args.trim()} · ${skill.name}`;
}
