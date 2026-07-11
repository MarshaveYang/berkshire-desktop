// 把 /skills/manifest.json + 各个 .md 文件打包成一个 TS 模块。
// Cloudflare Pages Functions 运行在 Workers 运行时里，没有文件系统，
// 所以不能在请求时 fs.readFile，必须在构建期把内容内联进代码。
// 用法：node scripts/generate-skills-data.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const skillsDir = join(root, "skills");

const manifest = JSON.parse(readFileSync(join(skillsDir, "manifest.json"), "utf-8"));

const skills = manifest.map((s) => {
  const promptTemplate = readFileSync(join(skillsDir, s.file), "utf-8");
  return { ...s, promptTemplate };
});

const banner = `// 自动生成，请勿手动编辑。
// 修改技能内容请编辑 /skills/*.md 或 /skills/manifest.json，
// 然后重新运行 \`npm run build\`（会自动执行本脚本）。
`;

const tsContent = `${banner}
export interface SkillDef {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  file: string;
  argHint: string;
  usageHint: string;
  supportsMulti: boolean;
  description: string;
  promptTemplate: string;
}

export const SKILLS: SkillDef[] = ${JSON.stringify(skills, null, 2)};

export function getSkillById(id: string): SkillDef | undefined {
  return SKILLS.find((s) => s.id === id);
}

// 不含 promptTemplate 的精简版，用于返回给前端（避免把完整提示词泄露到浏览器）
export const SKILLS_PUBLIC = SKILLS.map(({ promptTemplate, ...rest }) => rest);
`;

writeFileSync(join(root, "functions", "lib", "skills-data.ts"), tsContent, "utf-8");
console.log(`✅ 已生成 functions/lib/skills-data.ts，包含 ${skills.length} 个技能`);
