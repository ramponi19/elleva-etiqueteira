"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { allowHit, clientIp } from "@/lib/rate-limit";

export type EmailCheck = { exists: boolean } | { unknown: true };

/**
 * Diz se já existe conta com este e-mail. Usado pelo login pra mostrar
 * "não possui cadastro → criar conta" em vez do erro genérico (decisão de
 * produto). Como isso revela existência de conta, há um teto por IP pra frear
 * enumeração em massa; estourou o teto (ou a função não existe no banco ainda)
 * → devolve `unknown` e o login volta pra mensagem genérica.
 */
export async function emailHasAccount(email: string): Promise<EmailCheck> {
  const norm = (email ?? "").trim().toLowerCase();
  if (!norm || norm.length > 254 || !norm.includes("@")) return { unknown: true };

  const ip = await clientIp();
  if (!(await allowHit(`emailcheck:${ip}`, 15, 600))) return { unknown: true };

  try {
    const svc = await createServiceClient();
    const { data, error } = await svc.rpc("email_exists", { p_email: norm });
    if (error || typeof data !== "boolean") return { unknown: true };
    return { exists: data };
  } catch {
    return { unknown: true };
  }
}
