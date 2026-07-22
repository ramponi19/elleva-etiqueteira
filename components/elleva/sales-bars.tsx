import type { Point } from "@/lib/sales";
import { fmtBRL } from "@/lib/format";

// Gráfico de barras da receita (spec Cartaz de Show): tinta nas barras, a
// última (hoje) em sol. SVG puro, responsivo, sem dependência.
export function SalesBars({ data }: { data: Point[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length || 1;
  const bw = 100 / n;
  const total = data.reduce((a, d) => a + d.value, 0);

  return (
    <div className="w-full">
      <svg viewBox="0 0 100 42" preserveAspectRatio="none" className="block h-[170px] w-full" role="img" aria-label="Receita por dia (14 dias)">
        {/* linha de base */}
        <line x1="0" y1="40" x2="100" y2="40" stroke="var(--color-tinta)" strokeWidth="0.2" opacity="0.25" />
        {data.map((d, i) => {
          const h = (d.value / max) * 36;
          const last = i === data.length - 1;
          return (
            <rect
              key={i}
              x={i * bw + bw * 0.18}
              y={40 - Math.max(h, d.value > 0 ? 0.6 : 0)}
              width={bw * 0.64}
              height={Math.max(h, d.value > 0 ? 0.6 : 0)}
              rx="0.4"
              fill={last ? "var(--color-sol)" : "var(--color-tinta)"}
              opacity={d.value > 0 ? 1 : 0.12}
            >
              <title>{`${d.label}: ${fmtBRL(d.value)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-1.5 flex">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center font-mono text-[9px] text-tinta-45">
            {i % 2 === 0 ? d.label : ""}
          </span>
        ))}
      </div>
      {total === 0 && <p className="corpo-suave mt-3 text-center">Sem vendas nos últimos 14 dias ainda.</p>}
    </div>
  );
}
