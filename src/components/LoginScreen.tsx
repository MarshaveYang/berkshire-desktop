import { useState, lazy, Suspense, type FormEvent } from "react";
import { api } from "../lib/api";
import { useAppStore } from "../lib/store";

const FloatingLinesBackground = lazy(() => import("./FloatingLinesBackground"));

export default function LoginScreen() {
  const setAuthenticated = useAppStore((s) => s.setAuthenticated);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");
    try {
      await api.login(password);
      setAuthenticated(true);
    } catch (err: any) {
      setError(err.message || "登录失败");
      setPassword("");
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" });

  return (
    <div className="app-viewport desktop-wallpaper relative flex flex-col items-center justify-center text-ink select-none">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Suspense fallback={null}>
          <FloatingLinesBackground
            linesGradient={["#10B981", "#198c66", "#1a5542"]}
            enabledWaves={["middle", "top", "bottom"]}
            lineCount={9}
            lineDistance={80}
            animationSpeed={0.5}
            bendRadius={15}
            bendStrength={3.5}
          />
        </Suspense>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="text-center mb-10">
          <div className="text-7xl font-light tracking-wide text-ink">{timeStr}</div>
          <div className="text-lg text-ink2/70 mt-1">{dateStr}</div>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-mint-200/70 border border-mint-500/50 flex flex-col items-center justify-center icon-glyph text-ink text-base mb-4 shadow-md">
          <span>投研</span>
          <span>桌面</span>
        </div>
        <div className="text-white mb-4">买股票，从 AI Berkshire 开始</div>

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码"
            className="w-64 px-4 py-2 rounded-full glass-panel text-ink text-center
                       placeholder-ink2/40 outline-none focus:border-mint-500/50 transition-colors"
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-64 py-2 rounded-full bg-mint-500 hover:bg-mint-600 text-white transition-colors disabled:opacity-50"
          >
            {loading ? "验证中…" : "解锁"}
          </button>
        </form>
      </div>
    </div>
  );
}