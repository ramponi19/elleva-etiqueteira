"use client";

const ITEMS = [
  "Rastreabilidade total",
  "Integração ERP",
  "API REST",
  "Multi-impressora",
  "Variáveis dinâmicas",
  "Histórico de impressão",
  "ZPL / PDF / PNG",
  "SSO empresarial",
  "Relatórios em tempo real",
  "Suporte 24/7",
];

export function FeaturesTicker() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div
      style={{
        background: "var(--gold-500)",
        padding: "12px 0",
        overflow: "hidden",
        marginTop: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 48,
          whiteSpace: "nowrap",
          animation: "ellevaTicker 32s linear infinite",
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              color: "var(--navy-900)",
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: 9999,
                background: "rgba(14,24,36,.4)",
              }}
            />
            {item}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ellevaTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
