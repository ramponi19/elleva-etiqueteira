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
    <div className="bg-[#C9A96E] py-3 overflow-hidden">
      <div
        className="flex gap-12 whitespace-nowrap"
        style={{
          animation: "ticker 30s linear infinite",
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="text-[#1A2744] text-sm font-semibold uppercase tracking-widest flex-shrink-0 flex items-center gap-3"
          >
            <span className="w-1 h-1 rounded-full bg-[#1A2744]/40" />
            {item}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
