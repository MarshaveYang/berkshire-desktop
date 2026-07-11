import { useEffect, useState } from "react";
import { useAppStore } from "../lib/store";
import { api } from "../lib/api";
import IconTile from "./IconTile";
import CenterSearchBar from "./CenterSearchBar";
import ReportsFolderWindow from "./ReportsFolderWindow";
import ReportViewerWindow from "./ReportViewerWindow";
import SkillInfoWindow from "./SkillInfoWindow";

export default function Desktop() {
  const skills = useAppStore((s) => s.skills);
  const setSkills = useAppStore((s) => s.setSkills);
  const setReports = useAppStore((s) => s.setReports);
  const activeSkillId = useAppStore((s) => s.activeSkillId);
  const setActiveSkillId = useAppStore((s) => s.setActiveSkillId);
  const windows = useAppStore((s) => s.windows);
  const openWindow = useAppStore((s) => s.openWindow);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    api.skills().then(({ skills }) => setSkills(skills));
    api.listReports().then(({ reports }) => setReports(reports));
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, [setSkills, setReports]);

  // 按 id（英文）字母表顺序排列，保证顺序稳定、可预期
  const sortedSkills = [...skills].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="app-viewport desktop-wallpaper relative overflow-hidden text-ink">
      {/* 顶部菜单栏 */}
      <div className="fixed top-0 left-0 right-0 h-7 glass-panel flex items-center px-4 text-xs z-40 justify-between text-ink2">
        <div className="font-medium text-ink">AI Berkshire</div>
        <div className="flex items-center gap-4">
          <span>{now.toLocaleDateString("zh-CN", { month: "short", day: "numeric", weekday: "short" })}</span>
          <span>{now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
          <button
            onClick={async () => {
              await api.logout();
              window.location.reload();
            }}
            className="hover:text-ink"
          >
            锁定
          </button>
        </div>
      </div>

      {/* 技能图标：左上角开始，从左到右按字母序排列，视口不够宽自动换行 */}
      <div className="absolute top-12 left-6 right-32 flex flex-wrap gap-5 content-start z-10">
        {sortedSkills.map((skill) => (
          <IconTile
            key={skill.id}
            text4={skill.name}
            active={activeSkillId === skill.id}
            onClick={() => setActiveSkillId(skill.id)}
            onDoubleClick={() =>
              openWindow({
                id: `skill-${skill.id}`,
                kind: "skillInfo",
                title: skill.name,
                payload: { skill }
              })
            }
          />
        ))}
      </div>

      {/* 研究报告文件夹：固定在右下角，类似 mac 垃圾桶的位置 */}
      <div className="fixed bottom-6 right-6 z-10">
        <IconTile
          text4="研究报告"
          onDoubleClick={() =>
            openWindow({ id: "reportsFolder", kind: "reportsFolder", title: "研究报告" })
          }
        />
      </div>

      {/* 搜索框：视口正中央 */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="pointer-events-auto">
          <CenterSearchBar />
        </div>
      </div>

      {windows.map((w) => {
        if (w.kind === "reportsFolder") {
          return <ReportsFolderWindow key={w.id} zIndex={w.zIndex} />;
        }
        if (w.kind === "skillInfo") {
          return (
            <SkillInfoWindow key={w.id} id={w.id} zIndex={w.zIndex} skill={w.payload.skill} />
          );
        }
        if (w.kind === "reportViewer") {
          return (
            <ReportViewerWindow
              key={w.id}
              id={w.id}
              title={w.title}
              zIndex={w.zIndex}
              reportId={w.payload.reportId}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
