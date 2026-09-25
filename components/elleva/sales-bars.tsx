import type { Point } from "@/lib/sales";
import { fmtBRL } from "@/lib/format";

// Gráfico de barras da receita (spec Cartaz de Show): tinta nas barras, a
// última (hoje) em sol. SVG puro, responsivo, sem dependência.
export function SalesBars({ data }: { data: Point[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length || 1;
  const bw = 100 / n;
  const total = data.reduce((a, d) => a + d.value, 0);
  // Quantos rótulos de data mostrar: ~6–7 sempre, seja qual for o período. Com
  // "um sim, um não" fixo, em 30 dias eram 15 datas em ~260px no celular — elas
  // se atropelavam (ou, sem min-w-0, estouravam a tela). Auditoria 2026-09-25.
  const passo = n <= 7 ? 1 : n <= 14 ? 2 : n <= 31 ? 5 : Math.ceil(n / 6);

  return (
    <div className="w-full">
      <svg viewBox="0 0 100 42" preserveAspectRatio="none" className="block h-[170px] w-full" role="img" aria-label={`Receita por dia (${n} dias)`}>
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
          // min-w-0: cada fatia fica com 1/n da largura mesmo que o rótulo seja
          // maior (sem isso o flex não encolhe abaixo do texto e a linha estoura
          // a tela no celular). Só uma a cada `passo` fatias tem rótulo, então o
          // texto transborda pras vizinhas, que estão vazias.
          <span key={i} className="min-w-0 flex-1 whitespace-nowrap text-center font-mono text-[9px] text-tinta-60">
            {i % passo === 0 ? d.label : ""}
          </span>
        ))}
      </div>
      {total === 0 && <p className="corpo-suave mt-3 text-center">Sem vendas nos últimos {n} dias ainda.</p>}
    </div>
  );
}
