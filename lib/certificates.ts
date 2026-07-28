// ============================================================
// Certificado de participação — camada de leitura (render/validação pública)
// ============================================================
import { createServiceClient } from "@/lib/supabase/server";

export const DEFAULT_CERT_TITLE = "Certificado de Participação";
export const DEFAULT_CERT_BODY =
  "Certificamos que {nome} participou do evento {evento}, realizado em {data}, na cidade de {cidade}.";

export interface CertificateView {
  code: string;
  participantName: string;
  eventTitle: string;
  dateLabel: string;
  city: string;
  title: string;
  body: string; // com as variáveis já substituídas
  hours: string | null;
  signer: string | null;
}

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit", month: "long", year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
}

/** Busca um certificado pelo código público (para a página de validação/impressão). */
export async function getCertificate(code: string): Promise<CertificateView | null> {
  try {
    const svc = await createServiceClient();
    const { data: ticket } = await svc
      .from("tickets")
      .select("certificate_code, certificate_name, status, order_id, event_id")
      .eq("certificate_code", code)
      .single();
    if (!ticket || ticket.status !== "used") return null;

    const [{ data: order }, { data: ev }] = await Promise.all([
      svc.from("orders").select("buyer_name").eq("id", ticket.order_id).single(),
      svc
        .from("events")
        .select("title, starts_at, city, certificate_enabled, certificate_title, certificate_body, certificate_hours, certificate_signer")
        .eq("id", ticket.event_id)
        .single(),
    ]);
    if (!ev || !ev.certificate_enabled) return null;

    // nome informado por quem emitiu (participante real); só cai no comprador
    // se o certificado for antigo, de antes desse campo existir
    const participantName =
      (ticket.certificate_name as string | null)?.trim() || order?.buyer_name?.trim() || "Participante";
    const dateLabel = fmtDate(ev.starts_at as string);
    const city = (ev.city as string) ?? "";
    const hours = (ev.certificate_hours as string) || null;
    const vars = {
      nome: participantName,
      evento: ev.title as string,
      data: dateLabel,
      cidade: city,
      horas: hours ?? "",
    };
    return {
      code,
      participantName,
      eventTitle: ev.title as string,
      dateLabel,
      city,
      title: (ev.certificate_title as string) || DEFAULT_CERT_TITLE,
      body: fillTemplate((ev.certificate_body as string) || DEFAULT_CERT_BODY, vars),
      hours,
      signer: (ev.certificate_signer as string) || null,
    };
  } catch {
    return null;
  }
}
