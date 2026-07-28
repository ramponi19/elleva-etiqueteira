import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import RoleSelect from "@/components/app/role-select";
import type { Role } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Clientes · Admin" };

export default async function AdminClientes() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(300); // limite explicito (o corte do PostgREST era silencioso)

  const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Clientes &amp; usuários</h1>
      <p className="corpo-suave mb-6 mt-1">{users?.length ?? 0} usuário(s){(users?.length ?? 0) >= 300 ? " — mostrando os 300 mais recentes" : ""}.</p>
      <div className={card}>
        {(users ?? []).map((u, i) => (
          <div
            key={u.id}
            className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-tinta text-[12px] font-bold text-papel">
                {(u.full_name ?? "?").slice(0, 2).toUpperCase()}
              </span>
              <p className="m-0 truncate text-[14px] font-medium text-tinta">{u.full_name ?? "Sem nome"}</p>
            </div>
            <RoleSelect userId={u.id} current={u.role as Role} />
          </div>
        ))}
        {!users?.length && <p className="corpo-suave px-5 py-12 text-center">Nenhum usuário cadastrado ainda.</p>}
      </div>
    </div>
  );
}
