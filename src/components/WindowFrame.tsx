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
  initialX = 16,
  initialY = 40,
  width = 460,
  height = 640,
  children
}: WindowFrameProps) {
  const closeWindow = useAppStore((s) => s.closeWindow);
  const focusWindow = useAppStore((s) => s.focusWindow);
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [isMaximized, setIsMaximized] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );

  function onTitlePointerDown(e: ReactPointerEvent) {
    focusWindow(id);
    if (isMaximized) return; // 最大化状态下不允许拖拽
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

  const frameStyle = isMaximized
    ? { left: 6, top: 30, right: 6, bottom: 6, width: "auto", height: "auto", zIndex }
    : { left: pos.x, top: pos.y, width, height, zIndex };

  return (
    <div
      className="absolute rounded-xl overflow-hidden shadow-2xl glass-panel-strong flex flex-col text-ink"
      style={frameStyle}
      onPointerDownCapture={() => focusWindow(id)}
    >
      <div
        className="window-titlebar h-9 flex items-center px-3 gap-2 cursor-default flex-shrink-0"
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={onTitlePointerUp}
        onDoubleClick={() => setIsMaximized((v) => !v)}
      >
        <button
          onClick={() => closeWindow(id)}
          className="traffic-light bg-red-500 hover:brightness-110"
          title="关闭"
        />
        <button
          onClick={() => setIsMaximized((v) => !v)}
          className="traffic-light bg-mint-500 hover:brightness-110"
          title={isMaximized ? "还原" : "最大化"}
        />
        <div className="flex-1 text-center text-sm text-ink2 truncate pr-9">{title}</div>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
