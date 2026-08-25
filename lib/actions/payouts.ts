"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { computeProducerFinance } from "@/lib/finance";
import { round2 } from "@/lib/fees";
import { sendPayoutPaidEmail, sendPayoutRejectedEmail } from "@/lib/finance-emails";

type Res = { ok: true; amount?: number; url?: string } | { ok: false; error: string };

function refresh() {
  revalidatePath("/produtor/financeiro");
  revalidatePath("/admin/financeiro");
}

async function producerCtx() {
  // Qualquer conta logada tem financeiro de organizador; o saldo é calculado
  // sobre os eventos de que ela é dona (producer_id), então zera pra quem não
  // organizou nada. requestPayout/requestAdvance operam só no próprio saldo.
  const { user } = await getAuth();
  if (!user) return null;
  return user;
}
async function adminCtx() {
  const { user, role } = await getAuth();
  if (!user || role !== "admin") return null;
  return user;
}

// ============================================================
// PRODUTOR
// ============================================================

/** Solicita o repasse do saldo disponível (valor calculado no servidor). */
export async function requestPayout(): Promise<Res> {
  const user = await producerCtx();
  if (!user) return { ok: false, error: "Sem permissão." };
  let svc;
  try { svc = await createServiceClient(); } catch { return { ok: false, error: "Serviço indisponível." }; }

  const fin = await computeProducerFinance(svc, user.id);
  if (!fin.pixKey) return { ok: false, error: "Cadastre sua chave Pix antes de solicitar." };
  if (fin.disponivel <= 0) return { ok: false, error: "Não há saldo disponível para repasse." };

  const { error } = await svc.from("payouts").insert({
    producer_id: user.id,
    amount: fin.disponivel,
    net_amount: fin.disponivel,
    kind: "normal",
    status: "requested",
    created_by: user.id,
  });
  // índice único (0042) garante 1 solicitação aberta por tipo — mata a corrida
  // de dois cliques simultâneos comprometendo o mesmo saldo
  if (error) {
    if (/duplicate|unique/i.test(error.message))
      return { ok: false, error: "Você já tem uma solicitação de repasse em análise. Aguarde a Elleva processar." };
    return { ok: false, error: error.message };
  }
  refresh();
  return { ok: true, amount: fin.disponivel };
}

/** Antecipa o saldo retido (antes do evento) pagando a taxa % do produtor. */
export async function requestAdvance(valor?: number): Promise<Res> {
  const user = await producerCtx();
  if (!user) return { ok: false, error: "Sem permissão." };
  let svc;
  try { svc = await createServiceClient(); } catch { return { ok: false, error: "Serviço indisponível." }; }

  const fin = await computeProducerFinance(svc, user.id);
  if (!fin.advanceEnabled) return { ok: false, error: "A antecipação não está habilitada na sua conta. Fale com a Elleva." };
  if (!fin.pixKey) return { ok: false, error: "Cadastre sua chave Pix antes de solicitar." };
  if (fin.antecipavel <= 0) return { ok: false, error: "Não há saldo a liberar para antecipar." };

  const bruto = round2(Math.min(valor && valor > 0 ? valor : fin.antecipavel, fin.antecipavel));
  const fee = round2((bruto * fin.advanceFeePct) / 100);
  const net = round2(bruto - fee);
  if (net <= 0) return { ok: false, error: "Valor muito baixo para antecipar." };

  const { error } = await svc.from("payouts").insert({
    producer_id: user.id,
    amount: bruto,
    fee_pct: fin.advanceFeePct,
    fee_amount: fee,
    net_amount: net,
    kind: "advance",
    status: "requested",
    created_by: user.id,
    note: `Antecipação (taxa ${fin.advanceFeePct}%)`,
  });
  if (error) {
    if (/duplicate|unique/i.test(error.message))
      return { ok: false, error: "Você já tem uma antecipação em análise. Aguarde a Elleva processar." };
    return { ok: false, error: error.message };
  }
  refresh();
  return { ok: true, amount: net };
}

// ============================================================
// ADMIN
// ============================================================

/** Marca uma solicitação como PAGA (com comprovante: texto e/ou arquivo). */
export async function markPayoutPaid(
  payoutId: string,
  method: string,
  reference: string,
  receiptPath?: string,
  forcar?: boolean
): Promise<Res> {
  const admin = await adminCtx();
  if (!admin) return { ok: false, error: "Sem permissão." };
  const svc = await createServiceClient();

  // O valor foi congelado quando o produtor solicitou. Entre a solicitação e
  // este clique pode ter entrado reembolso, cancelamento ou débito — então o
  // saldo é RECONFERIDO agora. Sem isso, a Elleva pagava sobre saldo que já
  // não existia (o cenário clássico: 40 reembolsos depois do pedido de saque).
  const { data: alvo } = await svc
    .from("payouts")
    .select("producer_id, amount, kind, status")
    .eq("id", payoutId)
    .single();
  if (!alvo) return { ok: false, error: "Solicitação não encontrada." };
  if (alvo.status !== "requested") return { ok: false, error: "Essa solicitação já foi processada." };

  if (!forcar) {
    const fin = await computeProducerFinance(svc, alvo.producer_id as string);
    const amount = Number(alvo.amount);
    // cobertura = o que o produtor tem hoje + o que este payout já reservou
    const cobertura = round2((alvo.kind === "advance" ? fin.antecipavel : fin.disponivel) + amount);
    if (amount > cobertura + 0.01) {
      return {
        ok: false,
        error: `Saldo insuficiente HOJE: a solicitação é de ${amount.toFixed(2).replace(".", ",")} mas o produtor só tem cobertura de ${cobertura.toFixed(2).replace(".", ",")} (houve reembolso, cancelamento ou débito depois do pedido). Confira antes de pagar.`,
      };
    }
  }

  const { data, error } = await svc
    .from("payouts")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      method: method || "pix_manual",
      reference: reference || null,
      receipt_path: receiptPath || null,
      processed_by: admin.id,
    })
    .eq("id", payoutId)
    .eq("status", "requested")
    .select("producer_id, amount, fee_amount, net_amount, kind, reference");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "Essa solicitação já foi processada." };

  const p = data[0];
  await sendPayoutPaidEmail(svc, p.producer_id as string, {
    amount: Number(p.amount),
    net: Number(p.net_amount ?? p.amount),
    fee: Number(p.fee_amount ?? 0),
    kind: String(p.kind),
    reference: (p.reference as string) ?? null,
  });
  refresh();
  return { ok: true };
}

/** Nega/segura uma solicitação (com motivo) — o saldo volta a ficar disponível. */
export async function rejectPayout(payoutId: string, reason: string): Promise<Res> {
  const admin = await adminCtx();
  if (!admin) return { ok: false, error: "Sem permissão." };
  if (!reason.trim()) return { ok: false, error: "Informe o motivo." };
  const svc = await createServiceClient();
  const { data, error } = await svc
    .from("payouts")
    .update({ status: "rejected", rejected_reason: reason, processed_by: admin.id })
    .eq("id", payoutId)
    .eq("status", "requested")
    .select("producer_id, amount");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "Essa solicitação já foi processada." };
  await sendPayoutRejectedEmail(svc, data[0].producer_id as string, Number(data[0].amount), reason);
  refresh();
  return { ok: true };
}

/** Repassa direto o saldo disponível de um produtor (sem esperar solicitação). */
export async function adminPayoutProducer(
  producerId: string,
  method: string,
  reference: string,
  receiptPath?: string
): Promise<Res> {
  const admin = await adminCtx();
  if (!admin) return { ok: false, error: "Sem permissão." };
  const svc = await createServiceClient();
  const fin = await computeProducerFinance(svc, producerId);
  if (fin.disponivel <= 0) return { ok: false, error: "Esse produtor não tem saldo disponível." };
  const { error } = await svc.from("payouts").insert({
    producer_id: producerId,
    amount: fin.disponivel,
    net_amount: fin.disponivel,
    kind: "normal",
    status: "paid",
    paid_at: new Date().toISOString(),
    method: method || "pix_manual",
    reference: reference || null,
    receipt_path: receiptPath || null,
    created_by: admin.id,
  });
  if (error) return { ok: false, error: error.message };
  await sendPayoutPaidEmail(svc, producerId, {
    amount: fin.disponivel, net: fin.disponivel, fee: 0, kind: "normal", reference: reference || null,
  });
  refresh();
  return { ok: true, amount: fin.disponivel };
}

/** Lançamento manual (crédito/débito) no saldo do produtor. */
export async function createAdjustment(
  producerId: string,
  kind: "credit" | "debit",
  amount: number,
  reason: string
): Promise<Res> {
  const admin = await adminCtx();
  if (!admin) return { ok: false, error: "Sem permissão." };
  const v = round2(Number(amount));
  if (!Number.isFinite(v) || v <= 0) return { ok: false, error: "Valor inválido." };
  if (!reason.trim()) return { ok: false, error: "Descreva o motivo do lançamento." };
  const svc = await createServiceClient();
  const { error } = await svc.from("finance_adjustments").insert({
    producer_id: producerId, kind, amount: v, reason: reason.trim(), created_by: admin.id,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, amount: v };
}

/** Estorna um lançamento (soft): sai do saldo mas FICA no extrato. Apagar de
 *  verdade permitia remover um débito de chargeback sem deixar rastro. */
export async function deleteAdjustment(id: string, motivo?: string): Promise<Res> {
  const admin = await adminCtx();
  if (!admin) return { ok: false, error: "Sem permissão." };
  const svc = await createServiceClient();
  const { data, error } = await svc
    .from("finance_adjustments")
    .update({ reversed_at: new Date().toISOString(), reversed_by: admin.id, reversed_reason: motivo || "Estornado pelo admin" })
    .eq("id", id)
    .is("reversed_at", null)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "Esse lançamento já foi estornado." };
  refresh();
  return { ok: true };
}

/** Habilita/desabilita antecipação e define a taxa % do produtor. */
export async function setAdvanceSettings(
  producerId: string,
  enabled: boolean,
  feePct: number
): Promise<Res> {
  const admin = await adminCtx();
  if (!admin) return { ok: false, error: "Sem permissão." };
  const pct = Number(feePct);
  if (!Number.isFinite(pct) || pct < 0 || pct > 50) return { ok: false, error: "Taxa inválida (0 a 50%)." };
  const svc = await createServiceClient();
  const { error } = await svc
    .from("profiles")
    .update({ advance_enabled: enabled, advance_fee_pct: pct })
    .eq("id", producerId);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

/** URL assinada do comprovante (admin, ou o produtor dono do repasse). */
export async function getReceiptUrl(payoutId: string): Promise<Res> {
  const { user, role } = await getAuth();
  if (!user) return { ok: false, error: "Sem sessão." };
  const svc = await createServiceClient();
  const { data: p } = await svc.from("payouts").select("producer_id, receipt_path").eq("id", payoutId).single();
  // autorização ANTES de revelar se existe comprovante (senão dá pra enumerar
  // repasses de terceiros pela diferença das mensagens)
  if (!p || (role !== "admin" && p.producer_id !== user.id)) return { ok: false, error: "Sem permissão." };
  if (!p.receipt_path) return { ok: false, error: "Este repasse não tem comprovante anexado." };
  const { data, error } = await svc.storage.from("payout-receipts").createSignedUrl(p.receipt_path as string, 600);
  if (error || !data?.signedUrl) return { ok: false, error: "Não foi possível abrir o comprovante." };
  return { ok: true, url: data.signedUrl };
}
