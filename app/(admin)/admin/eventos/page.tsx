import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/app/page-header";
import FeaturedToggle from "@/components/app/featured-toggle";

export const metadata: Metadata = { title: "Eventos · Admin" };

export default async function AdminEventos() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, category, city, starts_at, status, is_featured")
    .order("starts_at", { ascending: true });

  return (
    <>
      <PageHeader
        title="Eventos"
        subtitle={`${events?.length ?? 0} evento(s) na plataforma. Marque os destaques que aparecem no carrossel da home.`}
      />
      <main style={{ padding: 32 }}>
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", overflow: "hidden" }}>
          {(events ?? []).map((e, i) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{e.title}</p>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>
                  {e.city} · {new Date(e.starts_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span className="cat-pill">{e.category}</span>
                <span className="cat-pill">{e.status}</span>
                <FeaturedToggle id={e.id} initial={!!e.is_featured} />
              </div>
            </div>
          ))}
          {!events?.length && (
            <p style={{ color: "var(--text-tertiary)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
              Nenhum evento.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
