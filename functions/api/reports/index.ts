import type { Env } from "../../lib/env";
import { getSkillById } from "../../lib/skills-data";
import { buildPrompt, buildReportTitle } from "../../lib/prompt";
import { generateReport, type Provider } from "../../lib/providers";

// GET /api/reports?sort=date|name&order=asc|desc
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const sort = url.searchParams.get("sort") === "name" ? "title" : "created_at";
  const order = url.searchParams.get("order") === "asc" ? "ASC" : "DESC";

  const { results } = await env.DB.prepare(
    `SELECT id, skill_id, skill_name, ticker, title, status, provider, model,
            tokens_input, tokens_output, created_at, updated_at
     FROM reports
     ORDER BY ${sort} ${order}
     LIMIT 500`
  ).all();

  return json({ reports: results });
};

// POST /api/reports  { skillId, ticker, provider? }
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { skillId?: string; ticker?: string; provider?: Provider };
  try {
    body = await request.json();
  } catch {
    return json({ error: "请求格式错误" }, 400);
  }

  const skillId = (body.skillId || "").trim();
  const ticker = (body.ticker || "").trim();
  const provider = (body.provider || env.DEFAULT_PROVIDER || "deepseek") as Provider;

  if (!skillId || !ticker) {
    return json({ error: "缺少 skillId 或 ticker" }, 400);
  }

  const skill = getSkillById(skillId);
  if (!skill) {
    return json({ error: `未知技能: ${skillId}` }, 404);
  }

  const id = crypto.randomUUID();
  const title = buildReportTitle(skill, ticker);
  const now = new Date().toISOString();

  // 先插入一条 running 状态的记录，避免生成过程中如果用户刷新页面看不到任何进度
  await env.DB.prepare(
    `INSERT INTO reports (id, skill_id, skill_name, ticker, title, status, provider, model, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'running', ?, '', ?, ?)`
  )
    .bind(id, skill.id, skill.name, ticker, title, provider, now, now)
    .run();

  try {
    const prompt = buildPrompt(skill, ticker);
    const result = await generateReport(provider, prompt, env);

    await env.DB.prepare(
      `UPDATE reports
       SET status = 'done', content = ?, model = ?, tokens_input = ?, tokens_output = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(result.content, result.model, result.tokensInput, result.tokensOutput, new Date().toISOString(), id)
      .run();

    return json({
      id,
      title,
      status: "done",
      content: result.content,
      provider: result.provider,
      model: result.model
    });
  } catch (err: any) {
    const message = err?.message || String(err);
    await env.DB.prepare(
      `UPDATE reports SET status = 'error', error_message = ?, updated_at = ? WHERE id = ?`
    )
      .bind(message, new Date().toISOString(), id)
      .run();

    return json({ id, title, status: "error", error: message }, 502);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}
