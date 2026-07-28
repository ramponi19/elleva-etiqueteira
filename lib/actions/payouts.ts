"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { computeProducerFinance } from "@/lib/finance";

/** Produtor solicita o repasse do saldo disponível. Cria um payout 'requested'
 *  com o valor disponível calculado no SERVIDOR (não confia em valor do cliente). */
export async function requestPayout(): Promise<{ ok: boolean; error?: string; amount?: number }> {
  const { user, role } = await getAuth();
  if (!user || (role !== "producer" && role !== "admin")) return { ok: false, error: "Sem permissão." };

  let svc;
  try { svc = await createServiceClient(); } catch { return { ok: false, error: "Serviço indisponível." }; }

  const fin = await computeProducerFinance(svc, user.id);
  if (fin.disponivel <= 0) return { ok: false, error: "Não há saldo disponível para repasse no momento." };

  const { error } = await svc.from("payouts").insert({
    producer_id: user.id,
    amount: fin.disponivel,
    status: "requested",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/produtor/financeiro");
  revalidatePath("/admin/financeiro");
  return { ok: true, amount: fin.disponivel };
}

async function adminOnly() {
  const { user, role } = await getAuth();
  if (!user || role !== "admin") return null;
  return user;
}

/** Admin marca uma solicitação como PAGA (com comprovante). */
export async function markPayoutPaid(
  payoutId: string,
  method: string,
  reference: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await adminOnly();
  if (!admin) return { ok: false, error: "Sem permissão." };
  const svc = await createServiceClient();
  const { error } = await svc
    .from("payouts")
    .update({ status: "paid", paid_at: new Date().toISOString(), method: method || "pix_manual", reference: reference || null })
    .eq("id", payoutId)
    .eq("status", "requested");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/financeiro");
  revalidatePath("/produtor/financeiro");
  return { ok: true };
}

/** Admin nega/segura uma solicitação (com motivo). */
export async function rejectPayout(payoutId: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await adminOnly();
  if (!admin) return { ok: false, error: "Sem permissão." };
  const svc = await createServiceClient();
  const { error } = await svc
    .from("payouts")
    .update({ status: "rejected", rejected_reason: reason || null })
    .eq("id", payoutId)
    .eq("status", "requested");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/financeiro");
  revalidatePath("/produtor/financeiro");
  return { ok: true };
}

/** Admin repassa direto o saldo disponível de um produtor (sem esperar solicitação). */
export async function adminPayoutProducer(
  producerId: string,
  method: string,
  reference: string
): Promise<{ ok: boolean; error?: string; amount?: number }> {
  const admin = await adminOnly();
  if (!admin) return { ok: false, error: "Sem permissão." };
  const svc = await createServiceClient();
  const fin = await computeProducerFinance(svc, producerId);
  if (fin.disponivel <= 0) return { ok: false, error: "Esse produtor não tem saldo disponível." };
  const { error } = await svc.from("payouts").insert({
    producer_id: producerId,
    amount: fin.disponivel,
    status: "paid",
    paid_at: new Date().toISOString(),
    method: method || "pix_manual",
    reference: reference || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/financeiro");
  revalidatePath("/produtor/financeiro");
  return { ok: true, amount: fin.disponivel };
}
