import type { Env } from "../../lib/env";
import { clearSessionCookie } from "../../lib/auth";

export const onRequestPost: PagesFunction<Env> = async () => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "Set-Cookie": clearSessionCookie()
    }
  });
};
