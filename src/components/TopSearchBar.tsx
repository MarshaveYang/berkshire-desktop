import { useState, type FormEvent } from "react";
import { useAppStore } from "../lib/store";
import { api } from "../lib/api";

const PROVIDERS: { id: string; label: string; note: string }[] = [
  { id: "deepseek", label: "DeepSeek（默认）", note: "不联网，用模型自身知识，成本低" },
  { id: "claude", label: "Claude", note: "唯一带联网搜索，数据更实时，成本较高" },
  { id: "openai", label: "OpenAI", note: "不联网" },
  { id: "minimax", label: "MiniMax", note: "不联网" }
];

export default function TopSearchBar() {
  const skills = useAppStore((s) => s.skills);
  const upsertReport = useAppStore((s) => s.upsertReport);
  const openWindow = useAppStore((s) => s.openWindow);
  const generating = useAppStore((s) => s.generating);
  const setGenerating = useAppStore((s) => s.setGenerating);

  const [ticker, setTicker] = useState("");
  const [skillId, setSkillId] = useState(skills[0]?.id ?? "");
  const [provider, setProvider] = useState("deepseek");
  const [error, setError] = useState("");

  const activeSkill = skills.find((s) => s.id === skillId) ?? skills[0];
  const activeProvider = PROVIDERS.find((p) => p.id === provider);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ticker.trim() || !skillId || generating) return;
    setError("");
    setGenerating(true);

    // 打开报告文件夹窗口，让用户能看到"生成中"的状态
    openWindow({ id: "reportsFolder", kind: "reportsFolder", title: "研究报告" });

    try {
      const res = await api.generateReport(skillId, ticker.trim(), provider);
      if (res.status === "done") {
        // 生成完成，直接打开报告
        openWindow({
          id: `report-${res.id}`,
          kind: "reportViewer",
          title: res.title,
          payload: { reportId: res.id }
        });
      } else if (res.status === "error") {
        setError(res.error || "生成失败");
      }
      // 刷新报告文件夹列表（组件内部会自己 refetch，这里只是提示一下）
      const { reports } = await api.listReports();
      reports.forEach((r) => upsertReport(r));
      setTicker("");
    } catch (err: any) {
      setError(err.message || "生成失败");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2
                 glass-panel rounded-full px-3 py-2 shadow-xl"
    >
      <span className="text-white/40 pl-2">🔍</span>
      <input
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        placeholder={activeSkill?.argHint || "输入股票代码 / 公司名 / 行业"}
        className="bg-transparent outline-none text-white placeholder-white/40 w-64"
      />
      <select
        value={skillId}
        onChange={(e) => setSkillId(e.target.value)}
        className="bg-white/10 text-white text-sm rounded-full px-3 py-1 outline-none border border-white/10"
      >
        {skills.map((s) => (
          <option key={s.id} value={s.id} className="text-black">
            {s.icon} {s.name}
          </option>
        ))}
      </select>
      <select
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
        title={activeProvider?.note}
        className="bg-white/10 text-white text-sm rounded-full px-3 py-1 outline-none border border-white/10"
      >
        {PROVIDERS.map((p) => (
          <option key={p.id} value={p.id} className="text-black">
            {p.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={generating || !ticker.trim()}
        className="bg-white/20 hover:bg-white/30 disabled:opacity-40 text-white text-sm
                   rounded-full px-4 py-1.5 transition-colors"
      >
        {generating ? "生成中…" : "生成报告"}
      </button>
      {activeProvider && !generating && (
        <div className="absolute -bottom-5 left-4 text-white/30 text-[11px]">
          {activeProvider.note}
        </div>
      )}
      {error && (
        <div className="absolute top-12 left-0 right-0 text-center text-red-300 text-xs">{error}</div>
      )}
    </form>
  );
}
