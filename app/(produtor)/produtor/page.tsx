import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/auth";
import { fmtBRL } from "@/lib/format";
import PageHeader from "@/components/app/page-header";
import StatCard from "@/components/app/stat-card";
import BarChart from "@/components/app/bar-chart";
import { lastNDays } from "@/lib/sales";

export const metadata: Metadata = { title: "Produtor" };

export default async function ProdutorOverview() {
  const { user } = await getAuth();
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, category, city, starts_at, status")
    .eq("producer_id", user!.id)
    .order("starts_at", { ascending: true });

  const { data: items } = await supabase
    .from("order_items")
    .select("unit_price, quantity, orders!inner(created_at, status)")
    .eq("orders.status", "paid");

  type ItemRow = { unit_price: number; quantity: number; orders: { created_at: string } | { created_at: string }[] };
  const rows = (items ?? []) as ItemRow[];
  const created = (r: ItemRow) => (Array.isArray(r.orders) ? r.orders[0]?.created_at : r.orders?.created_at) ?? new Date().toISOString();

  const revenue = rows.reduce((a, i) => a + Number(i.unit_price) * i.quantity, 0);
  const ticketsSold = rows.reduce((a, i) => a + i.quantity, 0);
  const series = lastNDays(
    rows.map((r) => ({ date: created(r), amount: Number(r.unit_price) * r.quantity })),
    14
  );

  const stats = [
    { label: "Meus eventos", value: String(events?.length ?? 0), icon: "solar:ticket-bold-duotone" },
    { label: "Ingressos vendidos", value: String(ticketsSold), icon: "solar:tag-horizontal-bold-duotone" },
    { label: "Receita", value: fmtBRL(revenue), icon: "solar:wallet-money-bold-duotone" },
  ];

  return (
    <>
      <PageHeader title="Visão geral" subtitle="Seus eventos e vendas." />
      <main style={{ padding: 32, maxWidth: 1000 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 24, marginTop: 24 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, margin: "0 0 16px" }}>
            Receita — últimos 14 dias
          </h2>
          <BarChart data={series} />
        </div>

        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 24, marginTop: 24 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, margin: "0 0 16px" }}>
            Meus eventos
          </h2>
          {!events?.length ? (
            <p style={{ color: "var(--text-tertiary)", fontSize: 14, textAlign: "center", padding: "32px 0" }}>
              Você ainda não tem eventos. Em breve você poderá criar um por aqui.
            </p>
          ) : (
            <div>
              {events.map((e, i) => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{e.title}</p>
                    <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>
                      {e.city} · {new Date(e.starts_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className="cat-pill">{e.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
