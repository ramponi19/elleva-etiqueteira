import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "customer" | "producer" | "admin";

/** Usuário atual + papel (lê profiles.role). */
export async function getAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null as Role | null };

  const { data } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return {
    user,
    role: ((data?.role as Role) ?? "customer") as Role,
    fullName: (data?.full_name as string | null) ?? null,
    avatarUrl: (data?.avatar_url as string | null) ?? null,
  };
}

/** Área inicial após login. Como no mercado (Sympla/Eventbrite), toda conta é
 *  comprador E organizador — só o admin (Elleva) tem área à parte. */
export function homeForRole(role: Role | null): string {
  return role === "admin" ? "/admin" : "/conta";
}

/** Exige login + um dos papéis; redireciona caso contrário. Use para o admin. */
export async function requireRole(allowed: Role[]) {
  const auth = await getAuth();
  if (!auth.user) redirect("/login");
  if (!auth.role || !allowed.includes(auth.role)) {
    redirect(homeForRole(auth.role));
  }
  return auth;
}

/** Exige apenas estar logado (qualquer papel). É o portão da área de
 *  organizador: qualquer conta pode criar/gerir eventos; a posse de cada
 *  evento é conferida por `producer_id` nas actions e na RLS. */
export async function requireAuth() {
  const auth = await getAuth();
  if (!auth.user) redirect("/login");
  return auth;
}
