import type { Env } from "../../lib/env";
import { createSessionCookie } from "../../lib/auth";

interface LoginBody {
  password?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: LoginBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: "请求格式错误" }, 400);
  }

  const password = body.password ?? "";
  if (!env.SITE_PASSWORD) {
    return json({ error: "服务端未配置 SITE_PASSWORD，请先在 Cloudflare 设置密码" }, 500);
  }

  // 简单密码比较即可：单密码场景，密码本身就存在 secret 里，不需要额外加盐哈希；
  // 如果想更严谨，可以自己在本地对 SITE_PASSWORD 做一次哈希存起来，这里从简。
  if (password !== env.SITE_PASSWORD) {
    // 故意不区分"密码错"和"用户不存在"之类的信息，统一提示
    return json({ error: "密码错误" }, 401);
  }

  const cookie = await createSessionCookie(env.SESSION_SECRET);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "Set-Cookie": cookie
    }
  });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}
