export default function Logo({
  variant = "dark",
  width = 46,
}: {
  variant?: "dark" | "light";
  width?: number;
}) {
  const stroke = variant === "light" ? "#fff" : "#0A0A0A";
  // Ticket clássico: recortes semicirculares nas laterais + linha de picote.
  return (
    <svg width={width} height={(width * 16) / 22} viewBox="1 4 22 16" fill="none">
      <path
        d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M15 5.5v2M15 11v2M15 16.5v2"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
