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
// FloatingLinesBackground 内部 bottomWavePosition 的默认值写的是对象字面量
// （`= { x: 2.0, y: -0.7, rotate: -1 }`），JS 默认参数每次调用都会重新求值，
// 也就是说只要我们不显式传这个 prop，它内部每次渲染都会生成一个新对象，
// 而这个对象又在它自己的 useEffect 依赖数组里——跟前面 linesGradient 是同一类坑，
// 只是这次是组件内部自己藏的，必须显式传一个稳定引用才能绕开。
const BOTTOM_WAVE_POSITION = { x: 2.0, y: -0.7, rotate: -1 };

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
          bottomWavePosition={BOTTOM_WAVE_POSITION}
        />
      </Suspense>
    </div>
  );
}