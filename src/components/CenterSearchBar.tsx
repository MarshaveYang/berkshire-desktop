import { useState, type FormEvent } from "react";
import { useAppStore } from "../lib/store";
import { api } from "../lib/api";

const PROVIDERS: { id: string; label: string; status: string }[] = [
  { id: "deepseek", label: "DeepSeek", status: "DeepSeek 状态正常，非实时数据" },
  { id: "claude", label: "Claude", status: "Claude 状态不可用，联网获取实时数据" },
  { id: "openai", label: "OpenAI", status: "OpenAI 状态不可用，联网获取实时数据" }
];

export default function CenterSearchBar() {
  const skills = useAppStore((s) => s.skills);
  const activeSkillId = useAppStore((s) => s.activeSkillId);
  const upsertReport = useAppStore((s) => s.upsertReport);
  const openWindow = useAppStore((s) => s.openWindow);
  const generating = useAppStore((s) => s.generating);
  const setGenerating = useAppStore((s) => s.setGenerating);

  const [ticker, setTicker] = useState("");
  const [provider, setProvider] = useState("deepseek");
  const [error, setError] = useState("");

  const activeSkill = skills.find((s) => s.id === activeSkillId);
  const activeProvider = PROVIDERS.find((p) => p.id === provider);
  const ready = Boolean(activeSkill);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!activeSkill || !ticker.trim() || generating) return;
    setError("");
    setGenerating(true);

    openWindow({ id: "reportsFolder", kind: "reportsFolder", title: "研究报告" });

    try {
      const res = await api.generateReport(activeSkill.id, ticker.trim(), provider);
      if (res.status === "done") {
        openWindow({
          id: `report-${res.id}`,
          kind: "reportViewer",
          title: res.title,
          payload: { reportId: res.id }
        });
      } else if (res.status === "error") {
        setError(res.error || "生成失败");
      }
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
    <div className="flex flex-col items-center gap-2 w-[440px]">
      <div className="w-full px-4 mb-6">
        <div className="text-white/85 text-2xl italic leading-snug text-left">
          "Price is what you pay,
        </div>
        <div className="text-white/85 text-2xl italic leading-snug text-center mt-1">
          value is what you get.“
        </div>  
        <div className="text-white/50 text-sm mt-3 text-right">— Warren Buffett</div>
      </div>

      <div className="h-4 text-xs text-white text-center drop-shadow-sm">
        {ready ? `您正使用${activeSkill!.name}：${activeSkill!.usageHint}` : "点击一个技能图标开始"}
      </div>

      <form
        onSubmit={handleSubmit}
        className={`flex items-center gap-2 w-full glass-panel rounded-full px-3 py-2 shadow-xl
                    transition-opacity ${ready ? "" : "opacity-60"}`}
      >
        <span className="text-white/40 pl-2">🔍</span>
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          disabled={!ready}
          placeholder={ready ? "输入内容后回车生成" : "请先选择技能"}
          className="bg-transparent outline-none text-white placeholder-white/40 flex-1 min-w-0 disabled:cursor-not-allowed"
        />
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="bg-white/10 text-white text-sm rounded-full px-3 py-1 outline-none border border-white/15"
        >
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id} className="text-ink">
              {p.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!ready || generating || !ticker.trim()}
          className="bg-mint-500 hover:bg-mint-600 disabled:opacity-40 text-white text-sm
                     rounded-full px-4 py-1.5 transition-colors flex-shrink-0"
        >
          {generating ? "生成中…" : "生成"}
        </button>
      </form>

      <div className="h-4 text-[11px] text-white/70 text-center drop-shadow-sm">
        {error ? <span className="text-red-400">{error}</span> : activeProvider?.status}
      </div>
    </div>
  );
}
