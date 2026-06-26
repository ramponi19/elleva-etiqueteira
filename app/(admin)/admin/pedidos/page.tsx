import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { fmtBRL } from "@/lib/format";
import PageHeader from "@/components/app/page-header";
import OrderCancelButton from "@/components/app/order-cancel-button";

export const metadata: Metadata = { title: "Pedidos · Admin" };

export default async function AdminPedidos() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, buyer_name, buyer_email, total, status, payment_method, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Pedidos" subtitle={`${orders?.length ?? 0} pedido(s).`} />
      <main style={{ padding: 32 }}>
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", overflow: "hidden" }}>
          {(orders ?? []).map((o, i) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{o.buyer_name}</p>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>
                  {o.buyer_email} · {new Date(o.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span className="cat-pill">{o.payment_method}</span>
                <span className="cat-pill">{o.status}</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500, minWidth: 90, textAlign: "right" }}>
                  {fmtBRL(Number(o.total))}
                </span>
                <OrderCancelButton orderId={o.id} status={o.status} />
              </div>
            </div>
          ))}
          {!orders?.length && (
            <p style={{ color: "var(--text-tertiary)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
              Nenhum pedido ainda.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
