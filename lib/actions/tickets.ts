"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export type ValidateResult =
  | {
      ok: true;
      eventTitle: string;
      tierName: string;
      code: string;
      seat?: string;
      /** titular a conferir com o documento na entrada (comprador) */
      holderName?: string;
      holderDoc?: string;
      /** quando o ingresso foi transferido: o titular atual é este e-mail */
      transferEmail?: string;
    }
  | { ok: false; reason: "unauthorized" | "not_found" | "forbidden" | "used" | "cancelled" | "error"; message: string; usedAt?: string };

/** Dados do titular pra portaria conferir (nome/CPF do comprador, ou o e-mail
 *  de quem recebeu por transferência). */
async function holderInfo(
  svc: Awaited<ReturnType<typeof createServiceClient>>,
  ticket: { order_id: string; transferred: boolean | null; transfer_email: string | null; seat_label: string | null }
): Promise<{ seat?: string; holderName?: string; holderDoc?: string; transferEmail?: string }> {
  const seat = ticket.seat_label ?? undefined;
  if (ticket.transferred) {
    return { seat, transferEmail: ticket.transfer_email ?? undefined };
  }
  const { data: o } = await svc
    .from("orders")
    .select("buyer_name, buyer_cpf")
    .eq("id", ticket.order_id)
    .single();
  return { seat, holderName: o?.buyer_name ?? undefined, holderDoc: o?.buyer_cpf ?? undefined };
}

export async function validateTicket(rawCode: string): Promise<ValidateResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, reason: "not_found", message: "Informe o código do ingresso." };

  const { user, role } = await getAuth();
  if (!user || (role !== "admin" && role !== "producer")) {
    return { ok: false, reason: "unauthorized", message: "Sem permissão para validar ingressos." };
  }

  let svc;
  try {
    svc = await createServiceClient();
  } catch {
    return { ok: false, reason: "error", message: "Serviço indisponível." };
  }

  const { data: ticket } = await svc
    .from("tickets")
    .select("id, code, event_id, event_title, tier_name, status, used_at, order_id, transferred, transfer_email, seat_label")
    .eq("code", code)
    .single();

  if (!ticket) {
    return { ok: false, reason: "not_found", message: "Ingresso não encontrado." };
  }

  // Produtor só valida ingressos dos próprios eventos
  if (role === "producer") {
    const { data: ev } = await svc
      .from("events")
      .select("producer_id")
      .eq("id", ticket.event_id)
      .single();
    if (!ev || ev.producer_id !== user.id) {
      return { ok: false, reason: "forbidden", message: "Este ingresso não é de um evento seu." };
    }
  }

  if (ticket.status === "cancelled") {
    return { ok: false, reason: "cancelled", message: "Ingresso cancelado." };
  }
  if (ticket.status === "used") {
    return {
      ok: false,
      reason: "used",
      message: "Ingresso já utilizado.",
      usedAt: ticket.used_at ?? undefined,
    };
  }

  // Claim atômico: só a PRIMEIRA leitura consegue marcar 'used' (where status='valid').
  // Leituras simultâneas do mesmo código não afetam nenhuma linha → recusadas.
  const { data: claimed } = await svc
    .from("tickets")
    .update({ status: "used", used_at: new Date().toISOString() })
    .eq("id", ticket.id)
    .eq("status", "valid")
    .select("id");
  if (!claimed || claimed.length === 0) {
    return { ok: false, reason: "used", message: "Ingresso já utilizado." };
  }

  return { ok: true, eventTitle: ticket.event_title, tierName: ticket.tier_name, code: ticket.code, ...(await holderInfo(svc, ticket)) };
}

/**
 * Validação por LINK de check-in (equipe de portaria, sem login).
 * A autorização vem do token secreto do evento — quem tem o link valida
 * apenas ingressos daquele evento.
 */
export async function validateByToken(token: string, rawCode: string): Promise<ValidateResult> {
  const code = rawCode.trim().toUpperCase();
  if (!token) return { ok: false, reason: "unauthorized", message: "Link de check-in inválido." };
  if (!code) return { ok: false, reason: "not_found", message: "Informe o código do ingresso." };

  let svc;
  try {
    svc = await createServiceClient();
  } catch {
    return { ok: false, reason: "error", message: "Serviço indisponível." };
  }

  const { data: ev } = await svc
    .from("events")
    .select("id")
    .eq("checkin_token", token)
    .single();
  if (!ev) return { ok: false, reason: "unauthorized", message: "Link de check-in inválido ou revogado." };

  const { data: ticket } = await svc
    .from("tickets")
    .select("id, code, event_id, event_title, tier_name, status, used_at, order_id, transferred, transfer_email, seat_label")
    .eq("code", code)
    .single();

  if (!ticket) return { ok: false, reason: "not_found", message: "Ingresso não encontrado." };
  if (ticket.event_id !== ev.id) {
    return { ok: false, reason: "forbidden", message: "Este ingresso é de outro evento." };
  }
  if (ticket.status === "cancelled") return { ok: false, reason: "cancelled", message: "Ingresso cancelado." };
  if (ticket.status === "used") {
    return { ok: false, reason: "used", message: "Ingresso já utilizado.", usedAt: ticket.used_at ?? undefined };
  }

  // Claim atômico: só a PRIMEIRA leitura consegue marcar 'used' (where status='valid').
  // Leituras simultâneas do mesmo código não afetam nenhuma linha → recusadas.
  const { data: claimed } = await svc
    .from("tickets")
    .update({ status: "used", used_at: new Date().toISOString() })
    .eq("id", ticket.id)
    .eq("status", "valid")
    .select("id");
  if (!claimed || claimed.length === 0) {
    return { ok: false, reason: "used", message: "Ingresso já utilizado." };
  }

  return { ok: true, eventTitle: ticket.event_title, tierName: ticket.tier_name, code: ticket.code, ...(await holderInfo(svc, ticket)) };
}

/** Transfere um ingresso para outra pessoa (por e-mail). Rotaciona o código. */
export async function transferTicket(
  ticketId: string,
  toEmail: string
): Promise<{ ok: boolean; error?: string }> {
  const email = toEmail.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "E-mail inválido." };

  const { user } = await getAuth();
  if (!user) return { ok: false, error: "Sem sessão." };
  if (email === (user.email ?? "").toLowerCase()) return { ok: false, error: "Esse ingresso já é seu." };

  let svc;
  try {
    svc = await createServiceClient();
  } catch {
    return { ok: false, error: "Serviço indisponível." };
  }

  const { data: t } = await svc
    .from("tickets")
    .select("id, status, transferred, order_id, orders(user_id)")
    .eq("id", ticketId)
    .single();
  if (!t) return { ok: false, error: "Ingresso não encontrado." };
  if (t.status !== "valid") return { ok: false, error: "Só ingressos válidos podem ser transferidos." };

  const orderUser = (Array.isArray(t.orders) ? t.orders[0] : t.orders) as { user_id: string } | null;
  const isOwner = !t.transferred && orderUser?.user_id === user.id;
  if (!isOwner) return { ok: false, error: "Este ingresso não é seu para transferir." };

  const newCode = "ELV-" + randomBytes(5).toString("hex").toUpperCase();
  const { error } = await svc
    .from("tickets")
    .update({ transfer_email: email, transferred: true, code: newCode })
    .eq("id", ticketId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/conta");
  return { ok: true };
}

/** Regenera o token de check-in de um evento (revoga o link antigo). */
export async function regenerateCheckinToken(
  eventId: string
): Promise<{ ok: boolean; token?: string; error?: string }> {
  const { user, role } = await getAuth();
  if (!user || (role !== "admin" && role !== "producer")) {
    return { ok: false, error: "Sem permissão." };
  }
  let svc;
  try {
    svc = await createServiceClient();
  } catch {
    return { ok: false, error: "Serviço indisponível." };
  }
  // produtor só mexe nos próprios eventos
  if (role === "producer") {
    const { data: ev } = await svc.from("events").select("producer_id").eq("id", eventId).single();
    if (!ev || ev.producer_id !== user.id) return { ok: false, error: "Evento não é seu." };
  }
  const token = crypto.randomUUID().replace(/-/g, "");
  const { error } = await svc.from("events").update({ checkin_token: token }).eq("id", eventId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/produtor/validar");
  return { ok: true, token };
}
