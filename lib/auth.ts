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
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  return {
    user,
    role: ((data?.role as Role) ?? "customer") as Role,
    fullName: (data?.full_name as string | null) ?? null,
  };
}

/** Área inicial de cada papel. */
export function homeForRole(role: Role | null): string {
  if (role === "admin") return "/admin";
  if (role === "producer") return "/produtor";
  return "/conta";
}

/** Exige login + um dos papéis; redireciona caso contrário. */
export async function requireRole(allowed: Role[]) {
  const auth = await getAuth();
  if (!auth.user) redirect("/login");
  if (!auth.role || !allowed.includes(auth.role)) {
    redirect(homeForRole(auth.role));
  }
  return auth;
}
