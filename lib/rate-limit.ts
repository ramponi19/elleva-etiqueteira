import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

/** IP do cliente atrás da Vercel.
 *  A4: `x-vercel-forwarded-for` e `x-real-ip` são setados pela BORDA da Vercel e
 *  não são influenciáveis pelo cliente — usa-se eles primeiro. O `x-forwarded-for`
 *  pode ter valores FORJADOS prepend pelo cliente; se cair nele, usa-se o ÚLTIMO
 *  elemento (o mais próximo do servidor), nunca o [0]. Sem isso, o atacante trocava
 *  o header a cada request e anulava TODOS os tetos (cartão, cupom, PIN da portaria). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const vercel = h.get("x-vercel-forwarded-for");
  if (vercel) return (vercel.split(",")[0] || "sem-ip").trim();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    return parts[parts.length - 1] || "sem-ip";
  }
  return "sem-ip";
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
