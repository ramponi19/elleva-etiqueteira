"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendPixChangedEmail } from "@/lib/finance-emails";

async function ownsEvent(svc: Awaited<ReturnType<typeof createServiceClient>>, eventId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true;
  const { data } = await svc.from("events").select("producer_id").eq("id", eventId).single();
  return data?.producer_id === userId;
}

// Leva o usuário logado para a área de organizador. NÃO existe mais "virar
// produtor": como no mercado (Sympla/Eventbrite), toda conta já é comprador e
// organizador ao mesmo tempo. Quem não tem evento vê o painel vazio; o cadastro
// de organizador (chave Pix p/ repasse) é preenchido em /produtor/financeiro,
// não no signup. A posse de cada evento é garantida por `producer_id`.
export async function becomeProducerAndGo(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const to = String(formData.get("to") ?? "");
  const allowed = to.startsWith("/produtor") || to === "/criar-evento";
  redirect(allowed ? to : "/produtor");
}

/** Salva a conta de repasse (chave Pix) do produtor. */
export async function savePayoutAccount(input: {
  pixType: string;
  pixKey: string;
  holder: string;
  doc: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sem sessão." };

  const pixKey = input.pixKey.trim();
  if (!pixKey) return { ok: false, error: "Informe a chave Pix." };
  if (!input.holder.trim()) return { ok: false, error: "Informe o titular da conta." };

  // M8: a chave Pix decide PRA ONDE o repasse vai. Conta invadida = chave
  // trocada e dinheiro desviado sem alerta. Detecta a MUDANÇA (só quando o valor
  // muda) pra avisar o dono por e-mail.
  const { data: antes } = await supabase.from("profiles").select("payout_pix_key").eq("id", user.id).single();
  const mudou = (antes?.payout_pix_key ?? "") !== pixKey;

  const { error } = await supabase
    .from("profiles")
    .update({
      payout_pix_type: input.pixType || null,
      payout_pix_key: pixKey,
      payout_holder: input.holder.trim(),
      payout_doc: input.doc.trim() || null,
    })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  if (mudou && user.email) {
    await sendPixChangedEmail(user.email, input.holder.trim(), pixKey).catch(() => {});
  }
  revalidatePath("/produtor/financeiro");
  return { ok: true };
}

/** Produtor cria um cupom escopado a um evento seu. */
export async function createEventCoupon(input: {
  eventId: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  maxUses?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const { user, role } = await getAuth();
  if (!user) return { ok: false, error: "Sem permissão." };

  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, error: "Informe um código." };
  if (!(input.discountValue > 0)) return { ok: false, error: "Valor de desconto inválido." };
  if (input.discountType === "percent" && input.discountValue > 100) return { ok: false, error: "Percentual máximo é 100." };

  const svc = await createServiceClient();
  if (!(await ownsEvent(svc, input.eventId, user.id, role === "admin"))) {
    return { ok: false, error: "Evento não é seu." };
  }

  const { error } = await svc.from("coupons").insert({
    code,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    max_uses: input.maxUses ?? null,
    event_id: input.eventId,
    producer_id: user.id,
  });
  if (error) {
    return { ok: false, error: error.message.includes("duplicate") ? "Já existe um cupom com esse código." : error.message };
  }
  revalidatePath("/produtor/cupons");
  return { ok: true };
}

/** Ativa/desativa um cupom do próprio produtor. */
export async function toggleEventCoupon(code: string, active: boolean): Promise<{ ok: boolean; error?: string }> {
  const { user, role } = await getAuth();
  if (!user) return { ok: false, error: "Sem permissão." };
  const svc = await createServiceClient();
  let q = svc.from("coupons").update({ active }).eq("code", code);
  if (role !== "admin") q = q.eq("producer_id", user.id); // só mexe nos próprios
  const { error } = await q;
  if (error) return { ok: false, error: error.message };
  revalidatePath("/produtor/cupons");
  return { ok: true };
}
