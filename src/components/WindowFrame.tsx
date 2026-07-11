import { useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { useAppStore } from "../lib/store";

interface WindowFrameProps {
  id: string;
  title: string;
  zIndex: number;
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  children: ReactNode;
}

export default function WindowFrame({
  id,
  title,
  zIndex,
  initialX = 160,
  initialY = 100,
  width = 640,
  height = 460,
  children
}: WindowFrameProps) {
  const closeWindow = useAppStore((s) => s.closeWindow);
  const focusWindow = useAppStore((s) => s.focusWindow);
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );

  function onTitlePointerDown(e: ReactPointerEvent) {
    focusWindow(id);
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function onTitlePointerMove(e: ReactPointerEvent) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPos({ x: dragState.current.origX + dx, y: Math.max(28, dragState.current.origY + dy) });
  }

  function onTitlePointerUp() {
    dragState.current = null;
  }

  return (
    <div
      className="absolute rounded-xl overflow-hidden shadow-2xl glass-panel flex flex-col text-white"
      style={{ left: pos.x, top: pos.y, width, height, zIndex }}
      onPointerDownCapture={() => focusWindow(id)}
    >
      <div
        className="window-titlebar h-9 flex items-center px-3 gap-2 cursor-default flex-shrink-0"
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={onTitlePointerUp}
      >
        <button
          onClick={() => closeWindow(id)}
          className="traffic-light bg-red-500 hover:brightness-110"
          title="关闭"
        />
        <span className="traffic-light bg-yellow-500 opacity-60" />
        <span className="traffic-light bg-green-500 opacity-60" />
        <div className="flex-1 text-center text-sm text-white/80 truncate pr-12">{title}</div>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
