import type { Env } from "./lib/env";
import { isAuthenticated } from "./lib/auth";

// Cloudflare Pages Functions 的 _middleware.ts 会在同目录及子目录下的
// 所有请求之前执行。这里放在 /functions 根目录，所以对 /api/* 全部生效。
const PUBLIC_PATHS = new Set(["/api/auth/login"]);

export const onRequest: PagesFunction<Env> = async ({ request, next, env }) => {
  const url = new URL(request.url);

  // 只拦截 /api/*，静态资源和前端路由放行
  if (!url.pathname.startsWith("/api/")) {
    return next();
  }

  if (PUBLIC_PATHS.has(url.pathname)) {
    return next();
  }

  const ok = await isAuthenticated(request, env.SESSION_SECRET);
  if (!ok) {
    return new Response(JSON.stringify({ error: "未登录或会话已过期" }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  return next();
};
