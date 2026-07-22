import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/auth";
import { fmtBRL } from "@/lib/format";
import { lastNDays } from "@/lib/sales";
import Icon from "@/components/shared/icon";
import { Badge } from "@/components/ui/badge";
import { EmBreve } from "@/components/elleva/em-breve";
import { SalesBars } from "@/components/elleva/sales-bars";

export const metadata: Metadata = { title: "Vendas · Produtor" };

type ItemRow = {
  event_id: string | null;
  event_title: string;
  quantity: number;
  unit_price: number;
  orders: { status: string; created_at: string } | { status: string; created_at: string }[];
};
const ord = (r: ItemRow) => (Array.isArray(r.orders) ? r.orders[0] : r.orders);

export default async function ProdutorVendas() {
  const { user, role } = await getAuth();
  const supabase = await createClient();

  let evq = supabase
    .from("events")
    .select("id, title, starts_at, status")
    .order("starts_at", { ascending: false });
  if (role === "producer") evq = evq.eq("producer_id", user!.id);
  const { data: events } = await evq;
  const eventList = events ?? [];
  const ids = eventList.map((e) => e.id);

  let items: ItemRow[] = [];
  let tickets: { event_id: string | null; status: string }[] = [];
  if (ids.length) {
    const [{ data: it }, { data: tk }] = await Promise.all([
      supabase
        .from("order_items")
        .select("event_id, event_title, quantity, unit_price, orders!inner(status, created_at)")
        .in("event_id", ids)
        .eq("orders.status", "paid"),
      supabase.from("tickets").select("event_id, status").in("event_id", ids),
    ]);
    items = (it ?? []) as ItemRow[];
    tickets = tk ?? [];
  }

  const receita = items.reduce((a, i) => a + Number(i.unit_price) * i.quantity, 0);
  const vendidos = items.reduce((a, i) => a + i.quantity, 0);
  const pedidos = new Set(items.map((i) => ord(i)?.created_at)).size;
  const ticketMedio = pedidos ? receita / pedidos : 0;
  const serie = lastNDays(
    items.map((i) => ({
      date: ord(i)?.created_at ?? new Date().toISOString(),
      amount: Number(i.unit_price) * i.quantity,
    })),
    14
  );

  type Agg = { title: string; receita: number; vendidos: number; emitidos: number; usados: number; status: string };
  const byEvent = new Map<string, Agg>();
  for (const e of eventList) byEvent.set(e.id, { title: e.title, receita: 0, vendidos: 0, emitidos: 0, usados: 0, status: e.status });
  for (const i of items) {
    const a = i.event_id ? byEvent.get(i.event_id) : null;
    if (a) { a.receita += Number(i.unit_price) * i.quantity; a.vendidos += i.quantity; }
  }
  for (const t of tickets) {
    const a = t.event_id ? byEvent.get(t.event_id) : null;
    if (a && t.status !== "cancelled") { a.emitidos += 1; if (t.status === "used") a.usados += 1; }
  }
  const linhas = [...byEvent.values()].sort((a, b) => b.receita - a.receita);

  const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";
  const stats = [
    { label: "Receita (pagos)", value: fmtBRL(receita), icon: "lucide:wallet" },
    { label: "Ingressos vendidos", value: String(vendidos), icon: "lucide:ticket" },
    { label: "Pedidos pagos", value: String(pedidos), icon: "lucide:shopping-bag" },
    { label: "Ticket médio", value: fmtBRL(ticketMedio), icon: "lucide:trending-up" },
  ];

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Vendas</h1>
      <p className="corpo-suave mb-6 mt-1">Acompanhe as vendas dos seus eventos em tempo real.</p>

      {!eventList.length ? (
        <EmBreve icon="lucide:bar-chart-3" nota="Crie um evento para começar a vender e acompanhar aqui." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className={`${card} p-5`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-tinta text-sol">
                  <Icon icon={s.icon} style={{ fontSize: 20 }} />
                </span>
                <p className="corpo-suave mt-3">{s.label}</p>
                <p className="numero mt-0.5 text-[24px] text-tinta">{s.value}</p>
              </div>
            ))}
          </div>

          <div className={`${card} mt-6 p-6`}>
            <h2 className="rotulo text-tinta-60">Receita — últimos 14 dias</h2>
            <div className="mt-4">
              <SalesBars data={serie} />
            </div>
          </div>

          <h2 className="mb-3 mt-8 text-[18px] font-extrabold text-tinta">Por evento</h2>
          <div className={`${card} overflow-hidden`}>
            {linhas.map((l, i) => {
              const pct = l.emitidos ? Math.round((l.usados / l.emitidos) * 100) : 0;
              return (
                <div key={l.title} className={`px-5 py-4 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="m-0 text-[15px] font-medium text-tinta">{l.title}</p>
                    <span className="numero text-[16px] text-tinta">{fmtBRL(l.receita)}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-tinta-60">
                    <span>{l.vendidos} vendido(s)</span>
                    <span>Check-in: <strong className="text-tinta">{l.usados}/{l.emitidos}</strong> ({pct}%)</span>
                    <Badge tom={l.status === "published" ? "sol" : l.status === "sold_out" ? "cartaz" : "papel"}>{l.status}</Badge>
                  </div>
                </div>
              );
            })}
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
