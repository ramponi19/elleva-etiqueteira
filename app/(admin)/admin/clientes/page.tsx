import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/app/page-header";

export const metadata: Metadata = { title: "Clientes · Admin" };

const ROLE_LABEL: Record<string, string> = {
  customer: "Cliente",
  producer: "Produtor",
  admin: "Admin",
};

export default async function AdminClientes() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Clientes & usuários" subtitle={`${users?.length ?? 0} usuário(s).`} />
      <main style={{ padding: 32 }}>
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", overflow: "hidden" }}>
          {(users ?? []).map((u, i) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9999, background: "var(--navy-800)", color: "#F6F3EB", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>
                  {(u.full_name ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{u.full_name ?? "Sem nome"}</p>
              </div>
              <span className="cat-pill">{ROLE_LABEL[u.role] ?? u.role}</span>
            </div>
          ))}
          {!users?.length && (
            <p style={{ color: "var(--text-tertiary)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
              Nenhum usuário cadastrado ainda.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
