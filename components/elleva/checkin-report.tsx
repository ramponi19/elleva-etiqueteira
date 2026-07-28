import { createServiceClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/auth";
import { EmBreve } from "@/components/elleva/em-breve";

// Relatório de check-in no design Cartaz de Show.
// Agregado em SQL (migration 0044) e filtrado pelos eventos DO PRODUTOR: antes
// lia a tabela `tickets` inteira — o que (a) truncava em max-rows, (b) trazia,
// via RLS, ingressos que o próprio produtor havia COMPRADO de outros eventos, e
// (c) agrupava por título, fundindo duas edições com o mesmo nome.
export async function CheckinReportElleva() {
  const { user } = await getAuth();
  if (!user) return null;
  const svc = await createServiceClient();
  const { data } = await svc.rpc("producer_checkin_report", { p_producer: user.id });
  const rows = ((data ?? []) as { event_id: string; title: string; emitidos: number; usados: number }[])
    .map((r) => ({ id: r.event_id, title: r.title, total: Number(r.emitidos), used: Number(r.usados) }))
    .sort((a, b) => b.total - a.total);

  if (!rows.length) {
    return <EmBreve icon="lucide:clipboard-list" nota="Nenhum ingresso emitido ainda." />;
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white">
      {rows.map((c, i) => {
        const pct = c.total ? Math.round((c.used / c.total) * 100) : 0;
        return (
          <div
            key={c.id}
            className={i ? "border-t-[1.5px] border-dashed border-tinta p-5" : "p-5"}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="m-0 text-[15px] font-medium text-tinta">{c.title}</p>
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
