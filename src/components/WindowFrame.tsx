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

const MIN_WIDTH = 320;
const MIN_HEIGHT = 220;

export default function WindowFrame({
  id,
  title,
  zIndex,
  initialX = 16,
  initialY = 40,
  width = 640,
  height = 460,
  children
}: WindowFrameProps) {
  const closeWindow = useAppStore((s) => s.closeWindow);
  const focusWindow = useAppStore((s) => s.focusWindow);
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width, height });
  const [isMaximized, setIsMaximized] = useState(false);

  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );
  const resizeState = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(
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

  function onResizePointerDown(e: ReactPointerEvent) {
    e.stopPropagation();
    focusWindow(id);
    if (isMaximized) return; // 最大化状态下不允许手动缩放
    resizeState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW: size.width,
      origH: size.height
    };
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function onResizePointerMove(e: ReactPointerEvent) {
    if (!resizeState.current) return;
    const dx = e.clientX - resizeState.current.startX;
    const dy = e.clientY - resizeState.current.startY;
    setSize({
      width: Math.max(MIN_WIDTH, resizeState.current.origW + dx),
      height: Math.max(MIN_HEIGHT, resizeState.current.origH + dy)
    });
  }

  function onResizePointerUp() {
    resizeState.current = null;
  }

  const frameStyle = isMaximized
    ? { left: 6, top: 30, right: 6, bottom: 6, width: "auto", height: "auto", zIndex }
    : { left: pos.x, top: pos.y, width: size.width, height: size.height, zIndex };

  return (
    <div
      className="absolute rounded-xl overflow-hidden shadow-2xl glass-panel-strong flex flex-col text-ink"
      style={frameStyle}
      onPointerDownCapture={() => focusWindow(id)}
    >
      <div
        className="window-titlebar h-9 flex items-center px-3 gap-2 cursor-default flex-shrink-0"
        style={{ touchAction: "none" }}
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

      {!isMaximized && (
        <div
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-0.5 text-ink2/40 hover:text-ink2/70"
          style={{ touchAction: "none" }}
          title="拖拽调整大小"
        >
          <svg viewBox="0 0 10 10" width="9" height="9" fill="currentColor">
            <circle cx="8" cy="2" r="1" />
            <circle cx="8" cy="5" r="1" />
            <circle cx="8" cy="8" r="1" />
            <circle cx="5" cy="8" r="1" />
            <circle cx="2" cy="8" r="1" />
          </svg>
        </div>
      )}
    </div>
  );
}
