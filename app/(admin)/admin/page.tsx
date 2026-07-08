import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { fmtBRL } from "@/lib/format";
import Icon from "@/components/shared/icon";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin" };

const ORDER_TOM: Record<string, "sol" | "papel" | "tinta" | "cartaz"> = {
  paid: "sol",
  pending: "cartaz",
  cancelled: "tinta",
  refunded: "tinta",
};

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
    supabase.from("orders").select("total").eq("status", "paid"),
    supabase.from("orders").select("id, buyer_name, buyer_email, total, status, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const revenue = (paidOrders ?? []).reduce((a, o) => a + Number(o.total), 0);
  const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";

  const stats = [
    { label: "Receita (pagos)", value: fmtBRL(revenue), icon: "lucide:wallet" },
    { label: "Pedidos pagos", value: String(paidOrders?.length ?? 0), icon: "lucide:shopping-cart" },
    { label: "Eventos", value: String(eventsCount ?? 0), icon: "lucide:ticket" },
    { label: "Clientes", value: String(customersCount ?? 0), icon: "lucide:users" },
    { label: "Produtores", value: String(producersCount ?? 0), icon: "lucide:user-round" },
  ];

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Visão geral</h1>
      <p className="corpo-suave mb-6 mt-1">Resumo da operação da plataforma.</p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`${card} p-5`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-tinta text-sol">
              <Icon icon={s.icon} style={{ fontSize: 20 }} />
            </span>
            <p className="corpo-suave mt-3">{s.label}</p>
            <p className="numero mt-0.5 text-[26px] text-tinta">{s.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-[18px] font-extrabold text-tinta">Pedidos recentes</h2>
      <div className={card}>
        {!recentOrders?.length ? (
          <p className="corpo-suave px-5 py-12 text-center">
            Nenhum pedido ainda. Eles aparecem aqui assim que o checkout for finalizado.
          </p>
        ) : (
          recentOrders.map((o, i) => (
            <div
              key={o.id}
              className={`flex items-center justify-between gap-3 px-5 py-3.5 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}
            >
              <div className="min-w-0">
                <p className="m-0 truncate text-[14px] font-medium text-tinta">{o.buyer_name}</p>
                <p className="corpo-suave m-0 truncate">{o.buyer_email}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <Badge tom={ORDER_TOM[o.status] ?? "papel"}>{o.status}</Badge>
                <span className="numero text-[15px] text-tinta">{fmtBRL(Number(o.total))}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
