import { lazy, Suspense } from "react";

// three.js 体积不小，懒加载成单独的 chunk，不拖慢首屏加载；
// 加载完成前背景就是普通的渐变色，线条效果会稍晚一点"淡入"出现。
const FloatingLinesBackground = lazy(() => import("./FloatingLinesBackground"));

// 关键点：这两个数组必须是模块级常量，不能写成内联字面量传给组件。
// FloatingLinesBackground 内部建立 WebGL 场景的 useEffect 依赖了这些 props，
// 如果每次渲染都传一个新的数组字面量（哪怕内容一样），引用不相等会导致
// useEffect 判定"依赖变了"，整个 WebGL 场景被销毁重建一次——表现为页面闪烁。
// 之前 Desktop.tsx 每 30 秒的时钟刷新、每次点击图标切换选中态都会触发这个问题。
const LINES_GRADIENT = ["#10B981", "#198c66", "#1a5542"];
const ENABLED_WAVES: Array<"top" | "middle" | "bottom"> = ["middle", "top", "bottom"];

export default function AppBackground() {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ transform: "translateZ(0)", isolation: "isolate" }}
    >
      <Suspense fallback={null}>
        <FloatingLinesBackground
          linesGradient={LINES_GRADIENT}
          enabledWaves={ENABLED_WAVES}
          lineCount={9}
          lineDistance={80}
          animationSpeed={0.5}
          bendRadius={15}
          bendStrength={3.5}
        />
      </Suspense>
    </div>
  );
}