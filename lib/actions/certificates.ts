"use server";

import { randomBytes } from "crypto";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/** Emite (ou recupera) o certificado de um ingresso do próprio usuário.
 *  Só libera após o check-in (status 'used') e se o evento emite certificado. */
export async function issueCertificate(
  ticketId: string,
  participantName?: string
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  // Posse verificada pela RLS: o usuário só enxerga os próprios ingressos.
  const supabase = await createClient();
  const { data: t } = await supabase
    .from("tickets")
    .select("id, status, certificate_code, event_id")
    .eq("id", ticketId)
    .single();
  if (!t) return { ok: false, error: "Ingresso não encontrado." };
  if (t.status !== "used")
    return { ok: false, error: "O certificado fica disponível após o check-in no evento." };
  if (t.certificate_code) return { ok: true, code: t.certificate_code as string };

  const { data: ev } = await supabase
    .from("events")
    .select("certificate_enabled")
    .eq("id", t.event_id)
    .single();
  if (!ev?.certificate_enabled)
    return { ok: false, error: "Este evento não emite certificado." };

  const nome = (participantName ?? "").trim();
  const code = "CERT-" + randomBytes(6).toString("hex").toUpperCase();
  try {
    const svc = await createServiceClient();
    // Claim ATÔMICO: só grava se ainda estiver nulo. O check-then-update anterior
    // deixava duas abas gerarem códigos diferentes — o último gravado invalidava
    // o certificado já impresso.
    const { data: claimed } = await svc
      .from("tickets")
      .update({ certificate_code: code, certificate_name: nome || null })
      .eq("id", ticketId)
      .is("certificate_code", null)
      .select("certificate_code");
    if (claimed?.length) return { ok: true, code };

    // já existia: devolve o código vigente
    const { data: cur } = await svc
      .from("tickets")
      .select("certificate_code")
      .eq("id", ticketId)
      .single();
    if (cur?.certificate_code) return { ok: true, code: cur.certificate_code as string };
    return { ok: false, error: "Não foi possível gerar o certificado." };
  } catch {
    return { ok: false, error: "Não foi possível gerar o certificado." };
  }
}
