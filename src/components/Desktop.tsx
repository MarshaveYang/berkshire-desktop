import { useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, BackgroundVariant, type Node, type NodeTypes } from "reactflow";
import "reactflow/dist/style.css";

import { useAppStore } from "../lib/store";
import { api } from "../lib/api";
import DesktopIconNode, { type DesktopIconData } from "./DesktopIconNode";
import TopSearchBar from "./TopSearchBar";
import ReportsFolderWindow from "./ReportsFolderWindow";
import ReportViewerWindow from "./ReportViewerWindow";
import SkillInfoWindow from "./SkillInfoWindow";

const nodeTypes: NodeTypes = { desktopIcon: DesktopIconNode };

export default function Desktop() {
  const skills = useAppStore((s) => s.skills);
  const setSkills = useAppStore((s) => s.setSkills);
  const setReports = useAppStore((s) => s.setReports);
  const windows = useAppStore((s) => s.windows);
  const openWindow = useAppStore((s) => s.openWindow);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    api.skills().then(({ skills }) => setSkills(skills));
    api.listReports().then(({ reports }) => setReports(reports));
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, [setSkills, setReports]);

  const nodes: Node<DesktopIconData>[] = useMemo(() => {
    const iconNodes: Node<DesktopIconData>[] = skills.map((skill, i) => ({
      id: `skill-${skill.id}`,
      type: "desktopIcon",
      position: { x: 40, y: 100 + i * 110 },
      draggable: true,
      data: {
        icon: skill.icon,
        label: skill.name,
        onDoubleClick: () =>
          openWindow({
            id: `skill-${skill.id}`,
            kind: "skillInfo",
            title: skill.name,
            payload: { skill }
          })
      }
    }));

    const folderNode: Node<DesktopIconData> = {
      id: "reportsFolder",
      type: "desktopIcon",
      position: { x: 40, y: 100 + skills.length * 110 + 40 },
      draggable: true,
      data: {
        icon: "🗂️",
        label: "研究报告",
        onDoubleClick: () =>
          openWindow({ id: "reportsFolder", kind: "reportsFolder", title: "研究报告" })
      }
    };

    return [...iconNodes, folderNode];
  }, [skills, openWindow]);

  async function handleLogout() {
    await api.logout();
    window.location.reload();
  }

  return (
    <div className="w-screen h-screen desktop-wallpaper relative overflow-hidden text-white">
      {/* 顶部菜单栏，仿 macOS 状态栏 */}
      <div className="fixed top-0 left-0 right-0 h-7 glass-panel flex items-center px-4 text-xs z-40 justify-between">
        <div className="font-medium">🏛️ AI Berkshire</div>
        <div className="flex items-center gap-4 text-white/70">
          <span>{now.toLocaleDateString("zh-CN", { month: "short", day: "numeric", weekday: "short" })}</span>
          <span>{now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
          <button onClick={handleLogout} className="hover:text-white">
            锁定
          </button>
        </div>
      </div>

      <TopSearchBar />

      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        panOnDrag={true}
        proOptions={{ hideAttribution: true }}
        minZoom={1}
        maxZoom={1}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="rgba(255,255,255,0.06)" />
      </ReactFlow>

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
