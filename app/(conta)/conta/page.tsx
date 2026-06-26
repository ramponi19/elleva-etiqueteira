import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/auth";
import { fmtBRL } from "@/lib/format";
import Icon from "@/components/shared/icon";
import PageHeader from "@/components/app/page-header";

export const metadata: Metadata = { title: "Meus ingressos" };

export default async function ContaOverview() {
  const { user } = await getAuth();
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, total, status, created_at, order_items(event_title, tier_name, quantity, unit_price)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Meus ingressos" subtitle="Seus pedidos e ingressos." />
      <main style={{ padding: 32, maxWidth: 900 }}>
        {!orders?.length ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <Icon icon="solar:ticket-bold-duotone" style={{ fontSize: 56, color: "var(--text-muted)" }} />
            <p className="lede" style={{ marginTop: 16 }}>Você ainda não tem ingressos.</p>
            <Link href="/agenda" className="btn btn-navy btn-lg" style={{ marginTop: 20 }}>
              Explorar eventos
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {orders.map((o) => {
              const its = (o.order_items ?? []) as { event_title: string; tier_name: string; quantity: number; unit_price: number }[];
              return (
                <div key={o.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                    </span>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span className="cat-pill">{o.status}</span>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500 }}>{fmtBRL(Number(o.total))}</span>
                    </div>
                  </div>
                  {its.map((it, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0", borderTop: idx ? "1px solid var(--border-subtle)" : "none" }}>
                      <span>{it.event_title} · <span style={{ color: "var(--text-tertiary)" }}>{it.tier_name} ×{it.quantity}</span></span>
                      <span>{fmtBRL(Number(it.unit_price) * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
