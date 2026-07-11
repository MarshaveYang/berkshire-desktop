import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 本地开发时把 /api 转发给 `wrangler pages dev` 起的 8788 端口
      "/api": "http://127.0.0.1:8788"
    }
  }
});
