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
    <WindowFrame id={id} title={skill.name} zIndex={zIndex} width={480} height={360}>
      <div className="p-6 text-sm leading-relaxed">
        <div className="text-4xl mb-3">{skill.icon}</div>
        <div className="text-lg font-medium mb-1">{skill.name}</div>
        <div className="text-white/50 mb-4">{skill.subtitle}</div>
        <p className="text-white/80 whitespace-pre-line">{skill.description}</p>
        <div className="mt-4 text-white/40 text-xs">
          用法提示：{skill.argHint}
          {skill.supportsMulti && "（支持一次输入多个，用逗号分隔）"}
        </div>
      </div>
    </WindowFrame>
  );
}
