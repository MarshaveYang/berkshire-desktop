import type { Env } from "../../lib/env";

// GET /api/reports/:id
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = String(params.id || "");
  if (!id) return json({ error: "缺少 id" }, 400);

  const row = await env.DB.prepare(
    `SELECT id, skill_id, skill_name, ticker, title, status, provider, model,
            content, error_message, tokens_input, tokens_output, created_at, updated_at
     FROM reports WHERE id = ?`
  )
    .bind(id)
    .first();

  if (!row) return json({ error: "报告不存在" }, 404);
  return json({ report: row });
};

// DELETE /api/reports/:id
export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  const id = String(params.id || "");
  if (!id) return json({ error: "缺少 id" }, 400);
  await env.DB.prepare(`DELETE FROM reports WHERE id = ?`).bind(id).run();
  return json({ ok: true });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}
