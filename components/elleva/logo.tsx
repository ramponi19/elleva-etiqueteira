import { clsx } from "clsx";

// Marca "A Noite" (2026-09): ícone-ingresso (bilhete laranja com E, picote e
// código de barras) + wordmark ELLEV em Archivo expandida com o A em V invertido
// (sem barra) laranja. Escala por font-size do container (tudo em em).
const A_PATH = "M0 74 L28 2 L56 74 L40 74 L28 27 L16 74 Z";

// Ícone-ingresso isolado (favicon/app/avatar e dentro do lockup).
export function MarkElleva({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 150 100" aria-hidden className={className} style={style}>
      <defs>
        <linearGradient id="elvSol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF9455" />
          <stop offset="1" stopColor="#EE4E14" />
        </linearGradient>
        <mask id="elvTk">
          <rect x="14" y="22" width="122" height="56" rx="11" fill="#fff" />
          <circle cx="14" cy="30" r="5" fill="#000" />
          <circle cx="14" cy="41" r="5" fill="#000" />
          <circle cx="14" cy="52" r="5" fill="#000" />
          <circle cx="14" cy="63" r="5" fill="#000" />
          <circle cx="14" cy="74" r="5" fill="#000" />
        </mask>
      </defs>
      {/* bilhete + serrilha */}
      <rect x="14" y="22" width="122" height="56" rx="11" fill="url(#elvSol)" mask="url(#elvTk)" />
      {/* E */}
      <g fill="#FBF2E6">
        <rect x="34" y="34" width="11" height="32" rx="2.5" />
        <rect x="34" y="34" width="30" height="10" rx="2.5" />
        <rect x="34" y="45" width="22" height="10" rx="2.5" />
        <rect x="34" y="56" width="30" height="10" rx="2.5" />
      </g>
      {/* picote */}
      <g fill="#100c17" opacity=".5">
        <circle cx="95" cy="31" r="2.6" />
        <circle cx="95" cy="40" r="2.6" />
        <circle cx="95" cy="49" r="2.6" />
        <circle cx="95" cy="58" r="2.6" />
        <circle cx="95" cy="67" r="2.6" />
      </g>
      {/* código de barras */}
      <g fill="#FBF2E6" opacity=".95">
        <rect x="106" y="34" width="2.6" height="32" />
        <rect x="111" y="34" width="1.6" height="32" />
        <rect x="115" y="34" width="3" height="32" />
        <rect x="121" y="34" width="1.6" height="32" />
        <rect x="125" y="34" width="2.6" height="32" />
        <rect x="130" y="34" width="1.6" height="32" />
      </g>
    </svg>
  );
}

// Alias de compatibilidade (imports antigos).
export const TicketIcon = MarkElleva;

// Lockup completo: ícone + ELLEV + A (V invertido laranja).
// A cor do texto vem de currentColor (creme no escuro, tinta no claro);
// o A é sempre var(--color-sol). Tamanho = font-size do container.
export function LogoElleva({ className }: { className?: string }) {
  return (
    <span
      className={clsx("inline-flex items-center", className)}
      style={{ gap: "0.42em", fontSize: "var(--elv-logo-size, 22px)", lineHeight: 1 }}
    >
      <MarkElleva style={{ height: "1.18em", width: "auto", flexShrink: 0 }} />
      <span
        style={{
          fontFamily: "var(--font-archivo), system-ui, sans-serif",
          fontWeight: 900,
          fontStretch: "125%",
          textTransform: "uppercase",
          letterSpacing: "0.005em",
          lineHeight: 1,
          whiteSpace: "nowrap",
          display: "inline-flex",
          alignItems: "baseline",
          color: "currentColor",
        }}
      >
        ELLEV
        <svg
          viewBox="0 0 56 74"
          aria-hidden
          style={{ height: "0.72em", width: "auto", marginLeft: "0.02em", alignSelf: "baseline", color: "var(--color-sol)" }}
        >
          <path d={A_PATH} fill="currentColor" />
        </svg>
      </span>
    </span>
  );
}
