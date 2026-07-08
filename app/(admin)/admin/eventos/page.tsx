import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import FeaturedToggle from "@/components/app/featured-toggle";

export const metadata: Metadata = { title: "Eventos · Admin" };

const STATUS_TOM: Record<string, "sol" | "papel" | "tinta"> = {
  published: "sol",
  draft: "papel",
  sold_out: "tinta",
  cancelled: "tinta",
};

export default async function AdminEventos() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, category, city, starts_at, status, is_featured")
    .order("starts_at", { ascending: true });

  const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Eventos</h1>
      <p className="corpo-suave mb-6 mt-1">
        {events?.length ?? 0} evento(s) na plataforma. Marque os destaques do carrossel da home.
      </p>
      <div className={card}>
        {(events ?? []).map((e, i) => (
          <div
            key={e.id}
            className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}
          >
            <div className="min-w-0">
              <p className="m-0 truncate text-[14px] font-medium text-tinta">{e.title}</p>
              <p className="corpo-suave m-0">{e.city} · {new Date(e.starts_at).toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <Badge tom="papel">{e.category}</Badge>
              <Badge tom={STATUS_TOM[e.status] ?? "papel"}>{e.status}</Badge>
              <FeaturedToggle id={e.id} initial={!!e.is_featured} />
            </div>
          </div>
        ))}
        {!events?.length && <p className="corpo-suave px-5 py-12 text-center">Nenhum evento.</p>}
      </div>
    </div>
  );
}
