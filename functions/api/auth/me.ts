import type { Env } from "../../lib/env";
import { isAuthenticated } from "../../lib/auth";

// 注意：这个接口本身也会被 _middleware.ts 拦截（因为不在 PUBLIC_PATHS 里），
// 未登录时中间件会直接返回 401，前端据此判断需要展示登录页即可，
// 不需要在这里再写一遍判断逻辑，但保留一个正常处理函数以防以后调整中间件白名单。
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const ok = await isAuthenticated(request, env.SESSION_SECRET);
  return new Response(JSON.stringify({ authenticated: ok }), {
    status: ok ? 200 : 401,
    headers: { "content-type": "application/json" }
  });
};
