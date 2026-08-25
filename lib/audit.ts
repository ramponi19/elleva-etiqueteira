import { getAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

/** Registra uma ação administrativa na trilha de auditoria (M7). Nunca lança —
 *  auditoria não pode derrubar a ação em si. O ator é o usuário logado. */
export async function audit(action: string, target: string | null, detail?: Record<string, unknown>): Promise<void> {
  try {
    const { user } = await getAuth();
    const svc = await createServiceClient();
    await svc.from("audit_log").insert({
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? null,
      action,
      target,
      detail: detail ?? null,
    });
  } catch {
    /* trilha best-effort — não interrompe o fluxo */
  }
}
