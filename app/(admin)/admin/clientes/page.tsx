import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import ClientsAdmin, { type AdminUser } from "@/components/app/clients-admin";
import type { Role } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Clientes · Admin" };

const LIMITE = 1000;

export default async function AdminClientes() {
  // Layout NÃO protege página: no App Router as duas renderizam em paralelo,
  // então o redirect do layout não impede esta consulta de rodar (docs do Next:
  // "A layout also does not control whether the rest of the route renders").
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(LIMITE);

  // `profiles` não guarda e-mail: sem isso o admin mudava o papel de alguém
  // identificado só por "Sem nome". O e-mail vem do auth.
  const emails = new Map<string, string>();
  try {
    const svc = await createServiceClient();
    const { data: list } = await svc.auth.admin.listUsers({ page: 1, perPage: LIMITE });
    for (const u of list?.users ?? []) if (u.email) emails.set(u.id, u.email);
  } catch {
    /* sem e-mails: a lista ainda funciona */
  }

  const lista: AdminUser[] = (users ?? []).map((u) => ({
    id: u.id,
    full_name: u.full_name,
    email: emails.get(u.id) ?? null,
    role: u.role as Role,
    created_at: u.created_at,
  }));

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Clientes &amp; usuários</h1>
      <p className="corpo-suave mb-6 mt-1">Busque por nome ou e-mail, ajuste o papel e exporte a lista.</p>
      <ClientsAdmin users={lista} truncated={lista.length >= LIMITE} />
    </div>
  );
}
