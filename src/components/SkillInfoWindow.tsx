import WindowFrame from "./WindowFrame";
import type { SkillPublic } from "../lib/store";

export default function SkillInfoWindow({
  id,
  zIndex,
  skill
}: {
  id: string;
  zIndex: number;
  skill: SkillPublic;
}) {
  return (
    <WindowFrame id={id} title={skill.name} zIndex={zIndex} width={408} height={310}>
      <div className="p-6 text-sm leading-relaxed">
        <div className="text-lg font-medium mb-1 text-white">{skill.name}</div>
        <div className="text-white/60 mb-4">{skill.subtitle}</div>
        <p className="text-white/80 whitespace-pre-line">{skill.description}</p>
        <div className="mt-4 text-white/50 text-xs">
          用法提示：{skill.usageHint}
        </div>
      </div>
    </WindowFrame>
  );
}
