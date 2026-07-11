import { useEffect } from "react";

/**
 * 移动端 Safari/Chrome 打开网页时，地址栏收起/展开的动画过程中，
 * 传统 `100vh` 不会跟着实时刷新（是加载那一刻的静态值），
 * 表现为：登录后桌面布局跑到可视区域外面，手动刷新一次才会矫正。
 *
 * 这里用 visualViewport（比 window.resize 更准，能感知地址栏、键盘弹出等变化）
 * 实时把当前可视高度写进一个 CSS 变量，配合 index.css 里 .app-viewport 的兜底链，
 * 在不支持 100dvh 的浏览器上也能拿到正确高度；支持 dvh 的浏览器则会优先用 dvh 本身。
 */
export function useViewportHeightFix() {
  useEffect(() => {
    function setHeight() {
      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${h}px`);
    }

    setHeight();
    window.addEventListener("resize", setHeight);
    window.addEventListener("orientationchange", setHeight);
    window.visualViewport?.addEventListener("resize", setHeight);

    return () => {
      window.removeEventListener("resize", setHeight);
      window.removeEventListener("orientationchange", setHeight);
      window.visualViewport?.removeEventListener("resize", setHeight);
    };
  }, []);
}
