import { createClient } from "@/lib/supabase/server";
import { EmBreve } from "@/components/elleva/em-breve";

// Relatório de check-in no design Cartaz de Show.
export async function CheckinReportElleva() {
  const supabase = await createClient();
  const { data: tickets } = await supabase.from("tickets").select("event_title, status");

  const map = new Map<string, { total: number; used: number }>();
  for (const t of tickets ?? []) {
    if (t.status === "cancelled") continue;
    const cur = map.get(t.event_title) ?? { total: 0, used: 0 };
    cur.total += 1;
    if (t.status === "used") cur.used += 1;
    map.set(t.event_title, cur);
  }
  const rows = [...map.entries()].sort((a, b) => b[1].total - a[1].total);

  if (!rows.length) {
    return <EmBreve icon="lucide:clipboard-list" nota="Nenhum ingresso emitido ainda." />;
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white">
      {rows.map(([title, c], i) => {
        const pct = c.total ? Math.round((c.used / c.total) * 100) : 0;
        return (
          <div
            key={title}
            className={i ? "border-t-[1.5px] border-dashed border-tinta p-5" : "p-5"}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="m-0 text-[15px] font-medium text-tinta">{title}</p>
              <span className="font-mono text-[12px] text-tinta-60">
                {c.used}/{c.total} ({pct}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-papel-2">
              <div className="h-full rounded-full bg-sol" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 flex gap-4 text-[12px] text-tinta-60">
              <span>Emitidos: <strong className="text-tinta">{c.total}</strong></span>
              <span>Validados: <strong className="text-tinta">{c.used}</strong></span>
              <span>Restantes: <strong className="text-tinta">{c.total - c.used}</strong></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
