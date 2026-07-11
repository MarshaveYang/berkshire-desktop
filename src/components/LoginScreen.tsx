import { useState, type FormEvent } from "react";
import { api } from "../lib/api";
import { useAppStore } from "../lib/store";

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
    <div className="w-screen h-screen desktop-wallpaper flex flex-col items-center justify-center text-white select-none">
      <div className="text-center mb-10">
        <div className="text-7xl font-light tracking-wide">{timeStr}</div>
        <div className="text-lg text-white/80 mt-1">{dateStr}</div>
      </div>

      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-3xl shadow-lg mb-4">
        🏛️
      </div>
      <div className="text-white/90 mb-4">AI Berkshire</div>

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="输入密码"
          className="w-64 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-center
                     placeholder-white/50 outline-none focus:border-white/60 transition-colors"
        />
        {error && <div className="text-red-300 text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-64 py-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors disabled:opacity-50"
        >
          {loading ? "验证中…" : "解锁"}
        </button>
      </form>
    </div>
  );
}
