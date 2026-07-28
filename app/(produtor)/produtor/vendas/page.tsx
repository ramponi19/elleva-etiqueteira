import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/auth";
import { fmtBRL } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { EmBreve } from "@/components/elleva/em-breve";
import { VendasResumo, type VendaRow } from "@/components/elleva/vendas-resumo";

export const metadata: Metadata = { title: "Vendas · Produtor" };

// Tudo agregado em SQL (migrations 0043/0044): antes a página somava item por
// item e ticket por ticket no app — o PostgREST corta em max-rows SEM erro, então
// os números paravam de crescer. Também filtra pelos eventos DO PRODUTOR (antes a
// query de tickets/itens pegava, via RLS, o que ele havia COMPRADO de terceiros).
export default async function ProdutorVendas() {
  const { user } = await getAuth();
  if (!user) return null;
  const svc = await createServiceClient();

  const [{ data: diario }, { data: porEvento }, { data: checkin }, { data: eventos }] = await Promise.all([
    svc.rpc("producer_sales_daily", { p_producer: user.id, p_days: 400 }),
    svc.rpc("finance_event_totals", { p_producers: [user.id] }),
    svc.rpc("producer_checkin_report", { p_producer: user.id }),
    svc.from("events").select("id, title, status, starts_at").eq("producer_id", user.id).order("starts_at", { ascending: false }),
  ]);

  const rows: VendaRow[] = ((diario ?? []) as { dia: string; receita: number; qtd: number; pedidos: number }[]).map((d) => ({
    date: d.dia,
    amount: Number(d.receita),
    qty: Number(d.qtd),
    pedidos: Number(d.pedidos),
  }));

  const eventList = (eventos ?? []) as { id: string; title: string; status: string; starts_at: string }[];
  const totais = (porEvento ?? []) as { event_id: string; title: string; bruto: number; vendidos: number }[];
  const check = new Map(
    ((checkin ?? []) as { event_id: string; emitidos: number; usados: number }[]).map((c) => [c.event_id, c])
  );

  const linhas = totais
    .map((t) => {
      const ev = eventList.find((e) => e.id === t.event_id);
      const c = check.get(t.event_id);
      return {
        id: t.event_id,
        title: t.title,
        receita: Number(t.bruto),
        vendidos: Number(t.vendidos),
        emitidos: Number(c?.emitidos ?? 0),
        usados: Number(c?.usados ?? 0),
        status: ev?.status ?? "published",
      };
    })
    .filter((l) => l.receita > 0 || l.vendidos > 0)
    .sort((a, b) => b.receita - a.receita);

  const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Vendas</h1>
      <p className="corpo-suave mb-6 mt-1">Acompanhe as vendas dos seus eventos em tempo real.</p>

      {!eventList.length ? (
        <EmBreve icon="lucide:bar-chart-3" nota="Crie um evento para começar a vender e acompanhar aqui." />
      ) : (
        <>
          <VendasResumo rows={rows} />

          <h2 className="mb-3 mt-8 text-[18px] font-extrabold text-tinta">Por evento</h2>
          <div className={`${card} overflow-hidden`}>
            {linhas.length === 0 ? (
              <p className="corpo-suave px-5 py-12 text-center">Nenhuma venda ainda.</p>
            ) : (
              linhas.map((l, i) => {
                const pct = l.emitidos ? Math.round((l.usados / l.emitidos) * 100) : 0;
                return (
                  <div key={l.id} className={`px-5 py-4 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="m-0 text-[15px] font-medium text-tinta">{l.title}</p>
                      <span className="numero text-[16px] text-tinta">{fmtBRL(l.receita)}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-tinta-60">
                      <span>{l.vendidos} vendido(s)</span>
                      <span>Check-in: <strong className="text-tinta">{l.usados}/{l.emitidos}</strong> ({pct}%)</span>
                      <Badge tom={l.status === "published" ? "sol" : l.status === "sold_out" ? "cartaz" : "papel"}>
                        {({ published: "Publicado", sold_out: "Esgotado", draft: "Rascunho", cancelled: "Cancelado" } as Record<string, string>)[l.status] ?? l.status}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <p className="corpo-suave mt-4">
            A receita é o valor dos ingressos (a taxa de serviço é paga pelo comprador, por cima). O repasse e o
            extrato ficam na aba Financeiro.
          </p>
        </>
      )}
    </div>
  );
}
