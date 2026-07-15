import { useEffect, useState } from "react";
import WindowFrame from "./WindowFrame";
import { useAppStore } from "../lib/store";
import { api } from "../lib/api";

const STATUS_LABEL: Record<string, string> = {
  pending: "等待中",
  running: "生成中…",
  done: "已完成",
  error: "失败"
};

export default function ReportsFolderWindow({ zIndex }: { zIndex: number }) {
  const reports = useAppStore((s) => s.reports);
  const setReports = useAppStore((s) => s.setReports);
  const openWindow = useAppStore((s) => s.openWindow);
  const closeWindow = useAppStore((s) => s.closeWindow);
  const [sort, setSort] = useState<"date" | "name">("date");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refresh() {
    const { reports } = await api.listReports(sort, order);
    setReports(reports);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, order]);

  function openReport(id: string, title: string) {
    openWindow({ id: `report-${id}`, kind: "reportViewer", title, payload: { reportId: id } });
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`确定删除「${title}」？删除后无法恢复。`)) return;
    setDeletingId(id);
    try {
      await api.deleteReport(id);
      closeWindow(`report-${id}`); // 如果这份报告的详情窗口正开着，一并关掉
      await refresh();
    } catch (err: any) {
      window.alert(err.message || "删除失败");
    } finally {
      setDeletingId(null);
    }
  }

  function toggleSort(key: "date" | "name") {
    if (sort === key) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setOrder("desc");
    }
  }

  return (
    <WindowFrame id="reportsFolder" title="研究报告" zIndex={zIndex} width={720} height={480}>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 px-4 py-2 text-xs text-white/60 border-b border-white/10">
          <button onClick={() => toggleSort("date")} className={sort === "date" ? "text-white" : ""}>
            按日期排序 {sort === "date" && (order === "asc" ? "↑" : "↓")}
          </button>
          <button onClick={() => toggleSort("name")} className={sort === "name" ? "text-white" : ""}>
            按文件名排序 {sort === "name" && (order === "asc" ? "↑" : "↓")}
          </button>
          <button onClick={refresh} className="ml-auto hover:text-white">
            ⟳ 刷新
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
            还没有报告，去中间搜索框生成第一份吧
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-2">
            <table className="w-full text-sm">
              <thead className="text-white/40 text-xs">
                <tr className="text-left">
                  <th className="font-normal py-1 px-2">名称</th>
                  <th className="font-normal py-1 px-2">技能</th>
                  <th className="font-normal py-1 px-2">状态</th>
                  <th className="font-normal py-1 px-2">生成时间</th>
                  <th className="font-normal py-1 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr
                    key={r.id}
                    onDoubleClick={() => r.status === "done" && openReport(r.id, r.title)}
                    className={`group border-t border-white/10 hover:bg-white/5 cursor-default ${
                      r.status === "done" ? "cursor-pointer" : "opacity-60"
                    }`}
                  >
                    <td className="py-2 px-2 text-white">{r.title}</td>
                    <td className="py-2 px-2 text-white/60">{r.skill_name}</td>
                    <td className="py-2 px-2 text-white/60">{STATUS_LABEL[r.status] ?? r.status}</td>
                    <td className="py-2 px-2 text-white/40">
                      {new Date(r.created_at).toLocaleString("zh-CN")}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(r.id, r.title);
                        }}
                        disabled={deletingId === r.id}
                        title="删除这份报告"
                        className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400
                                   transition-opacity disabled:opacity-100 disabled:text-white/20"
                      >
                        {deletingId === r.id ? "…" : "✕"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </WindowFrame>
  );
}
