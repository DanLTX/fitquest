export default function Ring({ value, max, size = 200, stroke = 16, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / Math.max(max, 1), 1);
  const mid = size / 2;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="ring-bg" cx={mid} cy={mid} r={r} strokeWidth={stroke} fill="none" />
        <circle className="ring-fg" cx={mid} cy={mid} r={r} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${mid} ${mid})`} />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}