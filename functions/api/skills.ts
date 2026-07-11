import type { Env } from "../lib/env";
import { SKILLS_PUBLIC } from "../lib/skills-data";

export const onRequestGet: PagesFunction<Env> = async () => {
  return new Response(JSON.stringify({ skills: SKILLS_PUBLIC }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
