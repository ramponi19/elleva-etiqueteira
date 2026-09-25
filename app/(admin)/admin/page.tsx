import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { fmtBRL } from "@/lib/format";
import Icon from "@/components/shared/icon";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin" };

// rótulo em português (mostrava o valor cru do banco: "PAID"). Auditoria 2026-09-25.
const ORDER_LABEL: Record<string, string> = { paid: "Pago", pending: "Pendente", cancelled: "Cancelado", refunded: "Reembolsado" };
const ORDER_TOM: Record<string, "sol" | "papel" | "tinta" | "cartaz"> = {
  paid: "sol",
  pending: "cartaz",
  cancelled: "tinta",
  refunded: "tinta",
};

export default async function AdminOverview() {
  // Layout NÃO protege página: no App Router as duas renderizam em paralelo,
  // então o redirect do layout não impede esta consulta de rodar (docs do Next:
  // "A layout also does not control whether the rest of the route renders").
  await requireRole(["admin"]);
  const supabase = await createClient();
  // Receita/pedidos vêm de agregação em SQL: somar linha por linha aqui parava
  // de crescer no pedido ~1000 (corte silencioso do PostgREST).
  const svc = await createServiceClient();

  const [
    { count: eventsCount },
    { count: usuariosCount },
    { data: totais },
    { data: recentOrders },
    { data: eventProducers },
  ] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }), // select("*") e bloqueado pelos grants por coluna -> count vinha nulo ("Eventos 0")
    // Toda conta é comprador e organizador (modelo de mercado): "usuários" = todos
    // que não são a Elleva. "Organizadores" = quem de fato publicou algum evento.
    supabase.from("profiles").select("*", { count: "exact", head: true }).neq("role", "admin"),
    svc.rpc("admin_overview_totals"),
    supabase.from("orders").select("id, buyer_name, buyer_email, total, status, created_at").order("created_at", { ascending: false }).limit(8),
    svc.from("events").select("producer_id"),
  ]);

  const t = (Array.isArray(totais) ? totais[0] : totais) as { recebido: number; taxa: number; pedidos_pagos: number } | null;
  const revenue = Number(t?.recebido ?? 0);
  const organizadores = new Set((eventProducers ?? []).map((e) => e.producer_id).filter(Boolean)).size;
  const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";

  const stats = [
    { label: "Recebido (pagos)", value: fmtBRL(revenue), icon: "lucide:wallet" },
    { label: "Taxa da Elleva", value: fmtBRL(Number(t?.taxa ?? 0)), icon: "lucide:trending-up" },
    { label: "Pedidos pagos", value: String(Number(t?.pedidos_pagos ?? 0)), icon: "lucide:shopping-cart" },
    { label: "Eventos", value: String(eventsCount ?? 0), icon: "lucide:ticket" },
    { label: "Usuários", value: String(usuariosCount ?? 0), icon: "lucide:users" },
    { label: "Organizadores", value: String(organizadores), icon: "lucide:user-round" },
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
                <Badge tom={ORDER_TOM[o.status] ?? "papel"}>{ORDER_LABEL[o.status] ?? o.status}</Badge>
                <span className="numero text-[15px] text-tinta">{fmtBRL(Number(o.total))}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
