"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function ownsEvent(svc: Awaited<ReturnType<typeof createServiceClient>>, eventId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true;
  const { data } = await svc.from("events").select("producer_id").eq("id", eventId).single();
  return data?.producer_id === userId;
}

// Promove o usuário logado a "producer" (se ainda for "customer") e o leva a uma
// área de produtor. Estilo Sympla: qualquer pessoa pode criar evento — ao clicar
// em "Criar evento"/"Meus eventos" o papel é elevado automaticamente.
export async function becomeProducerAndGo(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if ((profile?.role ?? "customer") === "customer") {
    await supabase.from("profiles").update({ role: "producer" }).eq("id", user.id);
    // O header (layout de marketing) lê o papel a cada request; revalida a home.
    revalidatePath("/", "layout");
  }

  const to = String(formData.get("to") ?? "");
  const allowed = to.startsWith("/produtor") || to === "/criar-evento";
  const dest = allowed ? to : "/produtor";
  redirect(dest);
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
  if (!user || (role !== "producer" && role !== "admin")) return { ok: false, error: "Sem permissão." };

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
