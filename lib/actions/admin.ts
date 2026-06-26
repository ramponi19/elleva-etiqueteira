"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export type Role = "customer" | "producer" | "admin";

export async function setUserRole(
  userId: string,
  role: Role
): Promise<{ ok: boolean; error?: string }> {
  const { role: myRole } = await getAuth();
  if (myRole !== "admin") return { ok: false, error: "Sem permissão." };

  const svc = await createServiceClient();
  const { error } = await svc.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/clientes");
  return { ok: true };
}
