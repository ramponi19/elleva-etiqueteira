import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { fmtBRL } from "@/lib/format";
import PageHeader from "@/components/app/page-header";
import StatCard from "@/components/app/stat-card";
import BarChart from "@/components/app/bar-chart";
import { lastNDays } from "@/lib/sales";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverview() {
  const supabase = await createClient();

  const [
    { count: eventsCount },
    { count: customersCount },
    { count: producersCount },
    { data: paidOrders },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "producer"),
    supabase.from("orders").select("total, created_at").eq("status", "paid"),
    supabase.from("orders").select("id, buyer_name, buyer_email, total, status, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const revenue = (paidOrders ?? []).reduce((a, o) => a + Number(o.total), 0);
  const series = lastNDays(
    (paidOrders ?? []).map((o) => ({ date: o.created_at as string, amount: Number(o.total) })),
    14
  );

  const stats = [
    { label: "Receita (pagos)", value: fmtBRL(revenue), icon: "solar:wallet-money-bold-duotone" },
    { label: "Pedidos pagos", value: String(paidOrders?.length ?? 0), icon: "solar:cart-large-2-bold-duotone" },
    { label: "Eventos", value: String(eventsCount ?? 0), icon: "solar:ticket-bold-duotone" },
    { label: "Clientes", value: String(customersCount ?? 0), icon: "solar:users-group-rounded-bold-duotone" },
    { label: "Produtores", value: String(producersCount ?? 0), icon: "solar:user-id-bold-duotone" },
  ];

  return (
    <>
      <PageHeader title="Visão geral" subtitle="Resumo da operação da plataforma." />
      <main style={{ padding: 32, maxWidth: 1100 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
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
            Pedidos recentes
          </h2>
          {!recentOrders?.length ? (
            <p style={{ color: "var(--text-tertiary)", fontSize: 14, textAlign: "center", padding: "32px 0" }}>
              Nenhum pedido ainda. Os pedidos aparecem aqui assim que o checkout for finalizado.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recentOrders.map((o) => (
                <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{o.buyer_name}</p>
                    <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>{o.buyer_email}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span className="cat-pill">{o.status}</span>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500 }}>{fmtBRL(Number(o.total))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
