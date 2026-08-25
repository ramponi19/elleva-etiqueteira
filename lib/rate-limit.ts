import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

/** IP do cliente atrás da Vercel (primeiro da cadeia x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd?.split(",")[0] || h.get("x-real-ip") || "sem-ip").trim();
}

/** Conta esta tentativa e diz se AINDA está dentro do limite.
 *  FAIL-OPEN: se o rate limiter falhar, não trava o fluxo legítimo (retorna true). */
export async function allowHit(bucket: string, limit: number, windowSec: number): Promise<boolean> {
  try {
    const svc = await createServiceClient();
    const { data, error } = await svc.rpc("rate_limit", {
      p_bucket: bucket, p_limit: limit, p_window_seconds: windowSec, p_increment: true,
    });
    return error ? true : data !== false;
  } catch {
    return true;
  }
}

/** Só CONSULTA se o bucket já estourou (sem gastar uma tentativa). true = ainda ok. */
export async function isAllowed(bucket: string, limit: number, windowSec: number): Promise<boolean> {
  try {
    const svc = await createServiceClient();
    const { data, error } = await svc.rpc("rate_limit", {
      p_bucket: bucket, p_limit: limit, p_window_seconds: windowSec, p_increment: false,
    });
    return error ? true : data !== false;
  } catch {
    return true;
  }
}
