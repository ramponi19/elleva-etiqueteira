import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/auth";
import Icon from "@/components/shared/icon";
import PageHeader from "@/components/app/page-header";

export const metadata: Metadata = { title: "Meus eventos" };

export default async function ProdutorEventos() {
  const { user, role } = await getAuth();
  const supabase = await createClient();

  let q = supabase
    .from("events")
    .select("id, slug, title, category, city, starts_at, status")
    .order("starts_at", { ascending: true });
  // admin vê todos; produtor só os próprios
  if (role === "producer") q = q.eq("producer_id", user!.id);
  const { data: events } = await q;

  return (
    <>
      <PageHeader
        title="Meus eventos"
        subtitle="Crie e gerencie seus eventos."
        action={
          <Link href="/produtor/eventos/novo" className="btn btn-gold btn-md">
            <Icon icon="lucide:plus" /> Novo evento
          </Link>
        }
      />
      <main style={{ padding: 32 }}>
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", overflow: "hidden" }}>
          {(events ?? []).map((e, i) => (
            <Link
              key={e.id}
              href={`/produtor/eventos/${e.id}`}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: i ? "1px solid var(--border-subtle)" : "none", color: "inherit" }}
            >
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{e.title}</p>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>
                  {e.city} · {new Date(e.starts_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span className="cat-pill">{e.category}</span>
                <span className="cat-pill">{e.status}</span>
                <Icon icon="lucide:chevron-right" style={{ color: "var(--text-tertiary)" }} />
              </div>
            </Link>
          ))}
          {!events?.length && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-tertiary)" }}>
              <Icon icon="solar:ticket-bold-duotone" style={{ fontSize: 44, color: "var(--text-muted)" }} />
              <p className="body" style={{ marginTop: 12 }}>Você ainda não criou eventos.</p>
              <Link href="/produtor/eventos/novo" className="btn btn-navy btn-md" style={{ marginTop: 14 }}>
                Criar primeiro evento
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
