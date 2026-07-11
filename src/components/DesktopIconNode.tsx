import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

export interface DesktopIconData {
  icon: string;
  label: string;
  onDoubleClick: () => void;
}

function DesktopIconNode({ data }: NodeProps<DesktopIconData>) {
  return (
    <div
      className="flex flex-col items-center gap-1 w-20 select-none cursor-default group"
      onDoubleClick={data.onDoubleClick}
    >
      {/* 隐藏的 handle，纯粹是因为 React Flow 节点需要，不用于连线 */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div
        className="w-14 h-14 rounded-2xl bg-white/10 group-hover:bg-white/20 flex items-center
                   justify-center text-3xl shadow-md transition-colors border border-white/10"
      >
        {data.icon}
      </div>
      <div className="text-xs text-white text-center px-1 py-0.5 rounded bg-black/0 group-hover:bg-black/30 leading-tight">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

export default memo(DesktopIconNode);
