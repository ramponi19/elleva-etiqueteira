export default function Logo({
  variant = "dark",
  width = 46,
}: {
  variant?: "dark" | "light";
  width?: number;
}) {
  const stroke = variant === "light" ? "#fff" : "#0A0A0A";
  return (
    <svg width={width} height={(width * 38) / 48} viewBox="0 0 48 38" fill="none">
      <g transform="rotate(-14 22 19)">
        <rect x="2" y="9" width="34" height="20" rx="4" fill="none" stroke={stroke} strokeWidth="2" />
        <line x1="14" y1="12" x2="14" y2="26" stroke={stroke} strokeWidth="1.5" strokeDasharray="2.2 2.2" />
      </g>
      <g transform="rotate(5 22 19)">
        <rect x="9" y="9" width="34" height="20" rx="4" fill="none" stroke={stroke} strokeWidth="2" />
        <line x1="21" y1="12" x2="21" y2="26" stroke={stroke} strokeWidth="1.5" strokeDasharray="2.2 2.2" />
      </g>
    </svg>
  );
}
