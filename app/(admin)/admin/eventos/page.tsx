import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AdminEventsList, type AdminEvent } from "@/components/elleva/admin-events-list";

export const metadata: Metadata = { title: "Eventos · Admin" };

export default async function AdminEventos() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, category, city, starts_at, status, is_featured, service_fee_pct, max_installments")
    .order("starts_at", { ascending: false })
    .limit(500); // limite explicito (o corte do PostgREST era silencioso)

  const list: AdminEvent[] = (events ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    city: e.city,
    starts_at: e.starts_at,
    starts_label: new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(e.starts_at)),
    status: e.status,
    is_featured: !!e.is_featured,
    service_fee_pct: Number(e.service_fee_pct ?? 10),
    max_installments: Number(e.max_installments ?? 12),
  }));

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Eventos</h1>
      <p className="corpo-suave mb-6 mt-1">
        {list.length} evento(s) na plataforma. Edite, exclua e marque os destaques da home.
      </p>
      <AdminEventsList events={list} />
    </div>
  );
}
