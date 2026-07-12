interface IconTileProps {
  text4: string; // 恰好 4 个汉字，前两个字/后两个字分两行显示
  label?: string; // 图标下方的说明文字（比如副标题），可选
  active?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export default function IconTile({ text4, label, active, onClick, onDoubleClick }: IconTileProps) {
  const line1 = text4.slice(0, 2);
  const line2 = text4.slice(2, 4);

  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className="flex flex-col items-center gap-1.5 w-20 select-none outline-none group"
    >
      <div
        className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center
                    text-ink text-base icon-glyph shadow-sm border
                    transition-[background-color,border-color,box-shadow,transform] duration-200
                    ${
                      active
                        ? "backdrop-blur-xl bg-mint-200/80 border-mint-500/60 shadow-lg"
                        : "backdrop-blur-sm bg-white/20 border-transparent hover:bg-white/35"
                    }`}
        style={{ transform: active ? "translateZ(0) scale(1.05)" : "translateZ(0)" }}
      >
        <span>{line1}</span>
        <span>{line2}</span>
      </div>
      {label && (
        <div className="text-[11px] text-ink2 text-center leading-tight px-1">{label}</div>
      )}
    </button>
  );
}