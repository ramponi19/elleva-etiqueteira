"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export type ValidateResult =
  | { ok: true; eventTitle: string; tierName: string; code: string }
  | { ok: false; reason: "unauthorized" | "not_found" | "forbidden" | "used" | "cancelled" | "error"; message: string; usedAt?: string };

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
    .select("id, code, event_id, event_title, tier_name, status, used_at")
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

  await svc
    .from("tickets")
    .update({ status: "used", used_at: new Date().toISOString() })
    .eq("id", ticket.id);

  return { ok: true, eventTitle: ticket.event_title, tierName: ticket.tier_name, code: ticket.code };
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
    .select("id, code, event_id, event_title, tier_name, status, used_at")
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

  await svc
    .from("tickets")
    .update({ status: "used", used_at: new Date().toISOString() })
    .eq("id", ticket.id);

  return { ok: true, eventTitle: ticket.event_title, tierName: ticket.tier_name, code: ticket.code };
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
