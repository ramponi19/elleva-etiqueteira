import type { Point } from "@/lib/sales";

/** Gráfico de barras simples em SVG (sem dependência). */
export default function BarChart({ data }: { data: Point[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length || 1;
  const bw = 100 / n;

  return (
    <div style={{ width: "100%" }}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: "100%", height: 160, display: "block" }}>
        {data.map((d, i) => {
          const h = (d.value / max) * 36;
          return (
            <rect
              key={i}
              x={i * bw + bw * 0.15}
              y={40 - h}
              width={bw * 0.7}
              height={h}
              fill="var(--gold-500)"
              rx="0.5"
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
          );
        })}
      </svg>
      <div style={{ display: "flex", marginTop: 6 }}>
        {data.map((d, i) => (
          <span
            key={i}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              color: "var(--text-tertiary)",
            }}
          >
            {i % 2 === 0 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
